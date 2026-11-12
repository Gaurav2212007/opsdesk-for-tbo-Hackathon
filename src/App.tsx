import React, { useState, useEffect } from 'react';
import { store } from './lib/storage';
import { NavTab, Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { Dashboard } from './components/dashboard/Dashboard';
import { TicketTable } from './components/tickets/TicketTable';
import { TicketWorkspace } from './components/tickets/TicketWorkspace';
import { CreateTicketModal } from './components/tickets/CreateTicketModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { RoutingView } from './components/routing/RoutingView';
import { AgenciesView } from './components/agencies/AgenciesView';
import { ConversationsView } from './components/conversations/ConversationsView';
import { SLAView } from './components/sla/SLAView';
import { InsightsView } from './components/insights/InsightsView';
import { DataArchiveView } from './components/data/DataArchiveView';
import { GuidedEvaluationModal } from './components/common/GuidedEvaluationModal';

export default function App() {
  const [, setTick] = useState(0);

  // Active view
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Subscribe to store mutations
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setTick(t => t + 1);
    });

    // Run SLA tick periodically (every 15 seconds)
    const interval = setInterval(() => {
      store.tickSLAs();
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Keyboard shortcut for Cmd+K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Automatic first-time evaluator welcome tour
  useEffect(() => {
    const hasSeen = localStorage.getItem('opsdesk_tour_seen');
    if (!hasSeen) {
      setIsTourOpen(true);
      localStorage.setItem('opsdesk_tour_seen', 'true');
    }
  }, []);

  // Demo Scenario Quick-Jump Handler
  const handleLoadScenario = (scenarioId: string) => {
    if (scenarioId === 'primary') {
      setSelectedTicketId('TKT-10421');
    } else if (scenarioId === 'checkin') {
      setSelectedTicketId('TKT-10424');
    } else if (scenarioId === 'sideconvo') {
      setSelectedTicketId('TKT-10425');
    }
  };

  const handleSelectTicket = (id: string) => {
    setSelectedTicketId(id);
  };

  const handleBackToList = () => {
    setSelectedTicketId(null);
  };

  const allTickets = store.getTickets();
  const currentAgentId = store.getCurrentAgentId();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Primary Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
          setSelectedTicketId(null);
        }}
        onLoadScenario={handleLoadScenario}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenCreateModal={() => setIsCreateOpen(true)}
          onSelectTicket={handleSelectTicket}
          onOpenTour={() => setIsTourOpen(true)}
        />

        {/* Dynamic Content Viewport */}
        <main className="flex-1 flex overflow-hidden">
          {selectedTicketId ? (
            <TicketWorkspace
              ticketId={selectedTicketId}
              onBack={handleBackToList}
              onSelectTicket={handleSelectTicket}
            />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <Dashboard
                  onSelectTicket={handleSelectTicket}
                  onNavigateToTab={tab => setCurrentTab(tab)}
                />
              )}

              {currentTab === 'tickets' && (
                <TicketTable
                  tickets={allTickets}
                  onSelectTicket={handleSelectTicket}
                  title={store.getCurrentRole() === 'Agency' ? 'My Agency Tickets' : 'All Operations Cases'}
                  subtitle={
                    store.getCurrentRole() === 'Agency'
                      ? 'All support requests and bookings submitted by Global Travel Partners'
                      : 'Unified context repository of all customer, agency, and supplier cases'
                  }
                />
              )}

              {currentTab === 'my_queue' && (
                <TicketTable
                  tickets={allTickets.filter(t => t.assignedAgentId === currentAgentId)}
                  onSelectTicket={handleSelectTicket}
                  title="My Assigned Queue (Priya Sharma)"
                  subtitle="Active operations cases routed to your capacity desk"
                />
              )}

              {currentTab === 'triage' && (
                <TicketTable
                  tickets={allTickets.filter(t => !t.assignedAgentId || t.status === 'New')}
                  onSelectTicket={handleSelectTicket}
                  title="Unassigned Triage Queue"
                  subtitle="Pending automated rule dispatch or manual specialist allocation"
                />
              )}

              {currentTab === 'by_region' && (
                <TicketTable
                  tickets={allTickets}
                  onSelectTicket={handleSelectTicket}
                  title="Queue by Geographic Region"
                  subtitle="Operations cases grouped across APAC, India, Europe, Middle East, and Americas"
                  initialGroupBy="region"
                />
              )}

              {currentTab === 'by_intent' && (
                <TicketTable
                  tickets={allTickets}
                  onSelectTicket={handleSelectTicket}
                  title="Queue by Travel Intent"
                  subtitle="Operations cases grouped by Refund, Cancellation, Hotel, Flight, Payment, and Emergency"
                  initialGroupBy="intent"
                />
              )}

              {currentTab === 'linked_cases' && (
                <TicketTable
                  tickets={allTickets.filter(t => t.linkedTicketIds.length > 0)}
                  onSelectTicket={handleSelectTicket}
                  title={store.getCurrentRole() === 'Agency' ? 'My Linked TBOH Cases' : 'TBOH Linked Case Clusters'}
                  subtitle="Multi-issue travel itineraries with linked operational cases across bookings"
                />
              )}

              {currentTab === 'agencies' && (
                <AgenciesView onSelectTicket={handleSelectTicket} />
              )}

              {currentTab === 'conversations' && (
                <ConversationsView onSelectTicket={handleSelectTicket} />
              )}

              {currentTab === 'routing' && <RoutingView />}

              {currentTab === 'sla' && <SLAView onSelectTicket={handleSelectTicket} />}

              {currentTab === 'insights' && (
                <InsightsView onSelectTicket={handleSelectTicket} />
              )}

              {currentTab === 'data' && (
                <DataArchiveView onSelectTicket={handleSelectTicket} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTicket={handleSelectTicket}
      />

      <CreateTicketModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onTicketCreated={newId => {
          setSelectedTicketId(newId);
        }}
      />

      <GuidedEvaluationModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onSelectTicket={handleSelectTicket}
        onNavigateToTab={tab => {
          setCurrentTab(tab);
          setSelectedTicketId(null);
        }}
      />
    </div>
  );
}
