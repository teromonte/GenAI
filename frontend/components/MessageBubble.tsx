import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
    role: "user" | "assistant";
    content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
    const isUser = role === "user";

    return (
        <div
            className={cn(
                "flex w-full items-start gap-4 p-4",
                isUser ? "flex-row-reverse" : "flex-row"
            )}
        >
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className={isUser ? "bg-primary text-primary-foreground" : "bg-muted"}>
                    {isUser ? <User size={16} /> : <Bot size={16} />}
                </AvatarFallback>
            </Avatar>

            <div
                className={cn(
                    "flex max-w-[80%] flex-col gap-2 rounded-lg px-4 py-3 text-sm",
                    isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                )}
            >
                {isUser ? (
                    <div className="whitespace-pre-wrap">{content}</div>
                ) : (
                    <div className="prose prose-neutral dark:prose-invert max-w-none break-words text-sm">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                code: ({ node, inline, className, children, ...props }: any) => {
                                    return (
                                        <code
                                            className={cn(
                                                "bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 font-mono text-xs",
                                                className
                                            )}
                                            {...props}
                                        >
                                            {children}
                                        </code>
                                    );
                                },
                                pre: ({ children }) => (
                                    <pre className="overflow-x-auto rounded-lg bg-black/10 dark:bg-white/10 p-2 mb-2">
                                        {children}
                                    </pre>
                                ),
                                ul: ({ children }) => (
                                    <ul className="list-disc pl-4 mb-2 last:mb-0">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                    <ol className="list-decimal pl-4 mb-2 last:mb-0">{children}</ol>
                                ),
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
}
