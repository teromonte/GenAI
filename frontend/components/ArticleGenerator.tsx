"use client"

import { useState } from "react"
import { Sparkles, FileText, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"

export function ArticleGenerator() {
    const [topic, setTopic] = useState("")
    const [category, setCategory] = useState("General")
    const [generatedArticle, setGeneratedArticle] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const [isCopied, setIsCopied] = useState(false)

    const categories = ["General", "Technology", "Business", "Science", "Health", "Sports", "Entertainment"]

    const handleGenerate = async () => {
        if (!topic) return

        setIsGenerating(true)
        setGeneratedArticle("")

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: `Write a comprehensive article about "${topic}". Use the available news context.`,
                }),
            })

            if (response.ok) {
                const data = await response.json()
                setGeneratedArticle(data.answer)
            } else {
                throw new Error("Failed to generate article")
            }
        } catch (error) {
            console.error("Failed to generate article", error)
            toast.error("Error", {
                description: "Failed to generate article. Please try again.",
            })
        } finally {
            setIsGenerating(false)
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedArticle)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
        toast.success("Copied", {
            description: "Article copied to clipboard.",
        })
    }

    return (
        <Card className="w-full h-full border-none shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Article Generator
                </CardTitle>
                <CardDescription>Generate unique articles based on your news feeds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/30">
                    <div className="grid gap-4 sm:grid-cols-4">
                        <div className="sm:col-span-3">
                            <Input
                                placeholder="Enter a topic (e.g. AI advancements in 2024)"
                                value={topic}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
                            />
                        </div>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !topic}
                        className="w-full sm:w-auto self-end"
                    >
                        {isGenerating ? (
                            <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Generate Article
                    </Button>
                </div>

                {generatedArticle && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-muted-foreground">Generated Result</h3>
                            <Button variant="ghost" size="sm" onClick={handleCopy}>
                                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                <span className="sr-only">Copy</span>
                            </Button>
                        </div>
                        <div className="p-6 border rounded-lg bg-card prose prose-sm dark:prose-invert max-w-none overflow-auto max-h-[600px]">
                            <ReactMarkdown>{generatedArticle}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
