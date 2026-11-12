import React, { useState } from 'react';
import { MessageSquarePlus, X, Mail, Building, ShieldCheck } from 'lucide-react';
import { store } from '../../lib/storage';
import { SideConversation, Ticket } from '../../types';

interface CreateSideConvoModalProps {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateSideConvoModal: React.FC<CreateSideConvoModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const suppliers = store.getSuppliers();
  const defaultSupplier = suppliers.find(s => s.id === ticket.supplierId) || suppliers[0];

  const [targetType, setTargetType] = useState<'Supplier' | 'Agency' | 'Internal Team' | 'Escalation Manager'>('Supplier');
  const [recipientName, setRecipientName] = useState(defaultSupplier ? `${defaultSupplier.contactName} (${defaultSupplier.name})` : '');
  const [recipientEmail, setRecipientEmail] = useState(defaultSupplier?.contactEmail || '');
  const [subject, setSubject] = useState(`Ops Inquiry for ${ticket.tboh} - ${ticket.title}`);
  const [initialMessage, setInitialMessage] = useState(
    'Dear Supplier Operations, please provide current status regarding waiver clearance and confirm if penalty fee has been voided.'
  );

  if (!isOpen) return null;

  const handleSelectSupplier = (supId: string) => {
    const s = suppliers.find(sup => sup.id === supId);
    if (s) {
      setRecipientName(`${s.contactName} (${s.name})`);
      setRecipientEmail(s.contactEmail);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newConvo: SideConversation = {
      id: `sc-${Date.now()}`,
      ticketId: ticket.id,
      targetType,
      recipientName,
      recipientEmail,
      subject,
      status: 'Waiting Reply',
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: `scm-${Date.now()}`,
          sender: `${store.getCurrentRole()} (TBO Operations)`,
          isExternal: true,
          content: initialMessage,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    store.addSideConversation(ticket.id, newConvo);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-sky-400">
            <MessageSquarePlus className="w-5 h-5" />
            <h3 className="font-semibold text-sm text-slate-100">
              Start Dedicated Side Conversation
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-200">Explicit Recipient Persistence Guarantee</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Side conversation recipients are explicitly defined and decoupled from ticket groups.
                If this case is later transferred, reassigned, or escalated, this thread will not break.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Recipient Category
              </label>
              <select
                value={targetType}
                onChange={e => setTargetType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="Supplier">Supplier / Bedbank / GDS</option>
                <option value="Agency">External Agency Contact</option>
                <option value="Internal Team">Internal Finance / Audit Team</option>
                <option value="Escalation Manager">Escalation Manager Direct</option>
              </select>
            </div>

            {targetType === 'Supplier' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Preset Travel Supplier
                </label>
                <select
                  onChange={e => handleSelectSupplier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.type})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Recipient Name
              </label>
              <input
                required
                type="text"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Recipient Email
              </label>
              <input
                required
                type="email"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Subject Line
            </label>
            <input
              required
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Initial Side Conversation Message
            </label>
            <textarea
              required
              rows={3}
              value={initialMessage}
              onChange={e => setInitialMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors shadow-sm shadow-sky-600/30"
            >
              Start Side Conversation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
