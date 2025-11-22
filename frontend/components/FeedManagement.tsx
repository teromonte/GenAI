"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, RefreshCw, Rss } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Feed {
    id: number
    name: string
    url: string
    category: string
    is_active: number
    last_fetched: string | null
}

export function FeedManagement() {
    const [feeds, setFeeds] = useState<Feed[]>([])
    const [newFeedName, setNewFeedName] = useState("")
    const [newFeedUrl, setNewFeedUrl] = useState("")
    const [newFeedCategory, setNewFeedCategory] = useState("General")
    const [isLoading, setIsLoading] = useState(false)

    const categories = ["General", "Technology", "Business", "Science", "Health", "Sports", "Entertainment"]

    useEffect(() => {
        fetchFeeds()
    }, [])

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token")
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    }

    const fetchFeeds = async () => {
        try {
            const response = await fetch("/api/feeds", {
                headers: getAuthHeaders()
            })
            if (response.ok) {
                const data = await response.json()
                setFeeds(data)
            } else if (response.status === 401) {
                console.error("Unauthorized")
            }
        } catch (error) {
            console.error("Failed to fetch feeds", error)
        }
    }

    const handleAddFeed = async () => {
        if (!newFeedName || !newFeedUrl) return

        setIsLoading(true)
        try {
            const response = await fetch("/api/feeds", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: newFeedName,
                    url: newFeedUrl,
                    category: newFeedCategory,
                }),
            })

            if (response.ok) {
                toast.success("Feed added", {
                    description: "Successfully added new RSS feed.",
                })
                setNewFeedName("")
                setNewFeedUrl("")
                fetchFeeds()
            } else {
                throw new Error("Failed to add feed")
            }
        } catch (error) {
            console.error("Failed to add feed", error)
            toast.error("Error", {
                description: "Failed to add feed. Please check the URL.",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteFeed = async (id: number) => {
        try {
            const response = await fetch(`/api/feeds/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders()
            })

            if (response.ok) {
                toast.success("Feed deleted", {
                    description: "Successfully removed RSS feed.",
                })
                fetchFeeds()
            }
        } catch (error) {
            console.error("Failed to delete feed", error)
        }
    }

    const handleRefreshFeed = async (id: number) => {
        try {
            const response = await fetch(`/api/feeds/${id}/refresh`, {
                method: "POST",
                headers: getAuthHeaders()
            })

            if (response.ok) {
                const data = await response.json()
                toast.success("Feed refreshed", {
                    description: `Fetched ${data.new_articles} new articles.`,
                })
                fetchFeeds()
            }
        } catch (error) {
            console.error("Failed to refresh feed", error)
            toast.error("Error", {
                description: "Failed to refresh feed.",
            })
        }
    }

    return (
        <Card className="w-full h-full border-none shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Rss className="h-5 w-5" />
                    RSS Feeds
                </CardTitle>
                <CardDescription>Manage your news sources and categories.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Add New Feed Form */}
                    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/30">
                        <h3 className="text-sm font-medium">Add New Feed</h3>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Input
                                placeholder="Feed Name (e.g. BBC Tech)"
                                value={newFeedName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFeedName(e.target.value)}
                            />
                            <Input
                                placeholder="RSS URL"
                                value={newFeedUrl}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFeedUrl(e.target.value)}
                            />
                            <Select value={newFeedCategory} onValueChange={setNewFeedCategory}>
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
                        <Button onClick={handleAddFeed} disabled={isLoading} className="w-full sm:w-auto self-end">
                            {isLoading ? (
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="mr-2 h-4 w-4" />
                            )}
                            Add Feed
                        </Button>
                    </div>

                    {/* Feeds List */}
                    <div className="space-y-4">
                        {feeds.map((feed) => (
                            <div
                                key={feed.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium">{feed.name}</h4>
                                        <Badge variant="secondary" className="text-xs">
                                            {feed.category}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate max-w-[300px]">{feed.url}</p>
                                    {feed.last_fetched && (
                                        <p className="text-[10px] text-muted-foreground">
                                            Last updated: {new Date(feed.last_fetched).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRefreshFeed(feed.id)}
                                        title="Refresh Feed"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => handleDeleteFeed(feed.id)}
                                        title="Delete Feed"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {feeds.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                No feeds added yet. Add one to get started.
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
