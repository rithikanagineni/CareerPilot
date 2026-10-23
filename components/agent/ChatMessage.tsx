import type { ChatMessage as ChatMessageType } from '@/types';
import React from 'react';

interface ChatMessageProps {
  message: ChatMessageType;
}

// Lightweight markdown renderer — handles bold, headers, lists, code spans
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-base font-bold text-slate-900 mt-4 mb-2 first:mt-0">
          {inlineRender(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-slate-800 mt-3 mb-1.5 first:mt-0">
          {inlineRender(line.slice(4))}
        </h3>
      );
    } else if (line.match(/^[-*•]\s/) || line.match(/^\d+\.\s/)) {
      // Collect consecutive list items
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && (lines[i].match(/^[-*•]\s/) || lines[i].match(/^\d+\.\s/))) {
        const stripped = lines[i].replace(/^[-*•]\s/, '').replace(/^\d+\.\s/, '');
        listItems.push(
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
            <span>{inlineRender(stripped)}</span>
          </li>
        );
        i++;
      }
      elements.push(<ul key={`list-${i}`} className="space-y-1.5 my-2">{listItems}</ul>);
      continue;
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-sm text-slate-700 leading-relaxed">
          {inlineRender(line)}
        </p>
      );
    }
    i++;
  }

  return <>{elements}</>;
}

function inlineRender(text: string): React.ReactNode {
  // Handle **bold**, `code`, and plain text
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-mono border border-indigo-100">{part.slice(1, -1)}</code>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default function ChatMessageComponent({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2.5`}>
      {/* Agent avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-indigo-200">
          <span className="text-white text-[10px] font-bold">CP</span>
        </div>
      )}

      {/* Message bubble */}
      <div className={`max-w-[85%] group ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`${
            isUser
              ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-md shadow-indigo-200'
              : 'bg-white border border-indigo-50 rounded-2xl rounded-tl-md px-4 py-3.5 shadow-sm'
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : (
            <div>{renderMarkdown(message.content)}</div>
          )}

          {/* MCP tool badges */}
          {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-indigo-50 flex flex-wrap gap-1.5">
              {message.toolCalls.map((tc, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-semibold"
                >
                  🔧 {tc.toolName}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        {time && (
          <span className={`text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
            isUser ? 'text-slate-400 text-right mr-1' : 'text-slate-400 ml-1'
          }`}>
            {time}
          </span>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-slate-600 text-[10px] font-bold">You</span>
        </div>
      )}
    </div>
  );
}
