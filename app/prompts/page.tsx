import { MainLayout } from "@/components/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

// Mock data for prompts
const mockPrompts = [
  {
    id: "1",
    title: "Content Writer",
    description: "A prompt for generating blog content",
    category: "writing",
    project: "work",
    updatedAt: "2 days ago",
  },
  {
    id: "2",
    title: "Product Description",
    description: "Create compelling product descriptions",
    category: "writing",
    project: "work",
    updatedAt: "1 week ago",
  },
  {
    id: "3",
    title: "Landscape Generator",
    description: "Generate beautiful landscape images",
    category: "image",
    project: "personal",
    updatedAt: "3 days ago",
  },
  {
    id: "4",
    title: "Code Assistant",
    description: "Help with programming tasks",
    category: "chat",
    project: "work",
    updatedAt: "1 day ago",
  },
  {
    id: "5",
    title: "Email Responder",
    description: "Craft professional email responses",
    category: "writing",
    project: "work",
    updatedAt: "4 days ago",
  },
  {
    id: "6",
    title: "UI Design Helper",
    description: "Generate UI design ideas and feedback",
    category: "chat",
    project: "personal",
    updatedAt: "1 week ago",
  },
];

export default function PromptsPage() {
  return (
    <MainLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">All Prompts</h1>
          <p className="text-muted-foreground">Browse your collection of prompts</p>
        </div>
        <Button asChild>
          <Link href="/new">Create New Prompt</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockPrompts.map((prompt) => (
          <Link href={`/prompts/${prompt.id}`} key={prompt.id}>
            <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{prompt.title}</CardTitle>
                <CardDescription>{prompt.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-1">
                    {prompt.category}
                  </span>
                  <span className="text-xs bg-secondary/10 text-secondary rounded-full px-2 py-1">
                    {prompt.project}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                Updated {prompt.updatedAt}
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </MainLayout>
  );
} 