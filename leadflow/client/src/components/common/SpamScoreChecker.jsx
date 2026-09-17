import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

const SPAM_TRIGGERS = [
  '100% free',
  'act now',
  'risk free',
  'risk-free',
  'buy direct',
  'cash bonus',
  'earn money',
  'eliminate debt',
  'exclusive deal',
  'extra income',
  'fast cash',
  'free gift',
  'free money',
  'full refund',
  'get rich',
  'guarantee',
  'instant cash',
  'limited time offer',
  'make money',
  'miracle',
  'money back',
  'no cost',
  'no catch',
  'no risk',
  'not spam',
  'once in a lifetime',
  'one time offer',
  'order now',
  'pure profit',
  'save big',
  'urgent',
  'winner',
  'winning',
];

export const checkSpamScore = (subject = '', body = '') => {
  const text = `${subject} ${body}`.toLowerCase();
  const foundTriggers = [];

  SPAM_TRIGGERS.forEach((trigger) => {
    if (text.includes(trigger)) {
      foundTriggers.push(trigger);
    }
  });

  // Check for ALL CAPS subject line
  const cleanSubject = subject.replace(/[^a-zA-Z]/g, '');
  if (cleanSubject.length > 5 && cleanSubject === cleanSubject.toUpperCase()) {
    foundTriggers.push('ALL CAPS SUBJECT');
  }

  // Check for excessive exclamation marks
  if ((text.match(/!{2,}/g) || []).length > 0) {
    foundTriggers.push('Multiple exclamation marks (!!)');
  }

  // Check for $$$
  if (text.includes('$$$') || text.includes('$$')) {
    foundTriggers.push('Repeated dollar signs ($$)');
  }

  const score = foundTriggers.length;
  let level = 'SAFE'; // SAFE | CAUTION | HIGH
  if (score >= 3) level = 'HIGH';
  else if (score >= 1) level = 'CAUTION';

  return {
    score,
    level,
    triggers: foundTriggers,
  };
};

export default function SpamScoreChecker({ subject, body }) {
  const { score, level, triggers } = checkSpamScore(subject, body);

  if (score === 0) {
    return (
      <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-medium">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        <span>Spam Score: Safe (0 flags)</span>
      </div>
    );
  }

  if (level === 'CAUTION') {
    return (
      <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-medium" title={`Flags: ${triggers.join(', ')}`}>
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
        <span>Deliverability Caution: {score} spam flag{score > 1 ? 's' : ''} ({triggers.slice(0, 2).join(', ')})</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-[11px] font-medium" title={`Flags: ${triggers.join(', ')}`}>
      <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
      <span>High Spam Risk: {score} flags ({triggers.slice(0, 2).join(', ')})</span>
    </div>
  );
}

