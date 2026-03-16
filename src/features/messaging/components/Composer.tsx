"use client";

import { useState, useRef, useCallback, useEffect, type KeyboardEvent, type ChangeEvent } from "react";
import { Send, ImagePlus, Smile, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTypingIndicator } from "@/lib/messaging/hooks/useTypingIndicator";
import { useSendMessage, sendTyping } from "../hooks";
import { isAllowedMime } from "../security";

interface ComposerProps {
  conversationId: string;
  disabled?: boolean;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ".jpeg,.jpg,.png,.gif,.webp,.pdf,.doc,.docx";

/**
 * Composer — message input with file upload, emoji, and send button.
 */
export function Composer({ conversationId, disabled }: ComposerProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMutation = useSendMessage();

  const { notifyTyping } = useTypingIndicator(conversationId, sendTyping);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, []);

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    notifyTyping();
    requestAnimationFrame(adjustHeight);
  };

  // Submit
  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;
    if (sendMutation.isPending) return;

    sendMutation.mutate(
      {
        conversationId,
        body: trimmed || " ",
        attachments: files.length > 0 ? files : undefined,
      },
      {
        onSuccess: () => {
          setText("");
          setFiles([]);
          setFilePreviews([]);
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
          }
        },
      }
    );
  }, [text, files, conversationId, sendMutation]);

  // Enter to send, Shift+Enter for newline
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // File selection
  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files;
      if (!selected) return;

      const validFiles: File[] = [];
      for (let i = 0; i < selected.length && files.length + validFiles.length < MAX_FILES; i++) {
        if (selected[i].size <= MAX_FILE_SIZE && isAllowedMime(selected[i])) {
          validFiles.push(selected[i]);
        }
      }

      const newFiles = [...files, ...validFiles];
      setFiles(newFiles);

      // Generate previews for images
      const newPreviews = [...filePreviews];
      for (const file of validFiles) {
        if (file.type.startsWith("image/")) {
          newPreviews.push(URL.createObjectURL(file));
        } else {
          newPreviews.push("");
        }
      }
      setFilePreviews(newPreviews);

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [files, filePreviews]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      const removedPreview = filePreviews[index];
      if (removedPreview) URL.revokeObjectURL(removedPreview);
      const newPreviews = filePreviews.filter((_, i) => i !== index);
      setFiles(newFiles);
      setFilePreviews(newPreviews);
    },
    [files, filePreviews]
  );

  // Cleanup object URLs on unmount — use ref to avoid stale closure
  const previewsRef = useRef<string[]>([]);
  previewsRef.current = filePreviews;

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const canSend = (text.trim().length > 0 || files.length > 0) && !sendMutation.isPending;

  return (
    <div className="bg-white border-t border-border-light px-3 py-2.5">
      {/* File previews */}
      {files.length > 0 && (
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
          {files.map((file, index) => (
            <div key={index} className="relative flex-shrink-0 group">
              {filePreviews[index] ? (
                <img
                  src={filePreviews[index]}
                  alt={file.name}
                  className="w-14 h-14 rounded-lg object-cover border border-border-light"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-muted border border-border-light flex items-center justify-center">
                  <span className="text-[9px] text-muted-foreground text-center px-0.5 truncate">
                    {file.name.split(".").pop()?.toUpperCase()}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeFile(index)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-foreground text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Retirer ${file.name}`}
              >
                <X size={10} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* File upload */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-primary-50"
          aria-label="Ajouter une image"
          disabled={disabled || files.length >= MAX_FILES}
        >
          <ImagePlus size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Emoji (placeholder) */}
        <button
          type="button"
          className="flex-shrink-0 p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-primary-50"
          aria-label="Emoji"
          disabled={disabled}
        >
          <Smile size={20} />
        </button>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez votre message..."
            rows={1}
            disabled={disabled}
            className={cn(
              "w-full resize-none rounded-2xl border border-border bg-muted/30 px-4 py-2.5",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40",
              "transition-all duration-200 max-h-[120px]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend || disabled}
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
            canSend
              ? "bg-primary text-white hover:bg-primary-dark shadow-md shadow-primary/20 active:scale-95"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
          aria-label="Envoyer le message"
        >
          {sendMutation.isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
