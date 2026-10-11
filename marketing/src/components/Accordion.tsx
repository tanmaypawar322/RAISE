'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItemData {
  id: string;
  question: string;
  answer: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItemData[];
}

export function Accordion({ items }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = !!openIds[item.id];
        const buttonId = `accordion-btn-${item.id}`;
        const panelId = `accordion-panel-${item.id}`;

        return (
          <div
            key={item.id}
            className="rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-xs overflow-hidden"
          >
            <button
              id={buttonId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(item.id)}
              className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 text-left font-bold text-gray-900 text-sm sm:text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
            >
              <span className="flex items-start gap-3">
                <span className="text-orange-600 font-extrabold text-xs sm:text-sm mt-0.5">
                  Q{index + 1}.
                </span>
                <span>{item.question}</span>
              </span>
              <ChevronDown
                className={`w-5 h-5 text-gray-500 shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-orange-600' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/50"
              >
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
