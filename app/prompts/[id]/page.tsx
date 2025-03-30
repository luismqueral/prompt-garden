import { MainLayout } from "@/components/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

// Mock data for prompts
const mockPrompts = {
  "1": {
    id: "1",
    title: "Content Writer",
    description: "A prompt for generating blog content",
    category: "writing",
    project: "work",
    updatedAt: "2 days ago",
    content: "You are a professional content writer with expertise in [TOPIC]. Write a comprehensive blog post about [SUBJECT] that is engaging, informative, and optimized for SEO. The post should include a compelling introduction, 3-5 main sections with subheadings, and a conclusion. Use a conversational tone and include practical examples or case studies where relevant.",
  },
  "2": {
    id: "2",
    title: "Product Description",
    description: "Create compelling product descriptions",
    category: "writing",
    project: "work",
    updatedAt: "1 week ago",
    content: "Generate a persuasive and engaging product description for [PRODUCT_NAME]. The description should highlight the key features, benefits, and unique selling points. Use sensory language to help customers imagine using the product. The tone should be [TONE: professional/casual/luxurious] and target [TARGET_AUDIENCE]. Keep it between 100-150 words.",
  },
  "3": {
    id: "3",
    title: "Landscape Generator",
    description: "Generate beautiful landscape images",
    category: "image",
    project: "personal",
    updatedAt: "3 days ago",
    content: "Create a photorealistic landscape image of [LANDSCAPE_TYPE] during [TIME_OF_DAY]. The scene should include [ELEMENT1], [ELEMENT2], and [ELEMENT3]. The lighting should be [LIGHTING_DESCRIPTION] with a [MOOD/ATMOSPHERE] feel. Use a [STYLE: painterly/photographic/cinematic] approach with [COLOR_PALETTE] colors.",
  },
  "4": {
    id: "4",
    title: "Code Assistant",
    description: "Help with programming tasks",
    category: "chat",
    project: "work",
    updatedAt: "1 day ago",
    content: "Act as an expert [PROGRAMMING_LANGUAGE] developer. I need help with [SPECIFIC_TASK]. Please provide clear, efficient, and well-commented code examples. Explain your approach and any important concepts or best practices I should be aware of. If there are multiple ways to solve this problem, briefly mention the alternatives and why your suggested approach is preferable.",
  },
};

export default function PromptDetailPage({ params }: { params: { id: string } }) {
  const promptId = params.id;
  const prompt = mockPrompts[promptId as keyof typeof mockPrompts];
  
  if (!prompt) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold mb-4">Prompt not found</h1>
          <p className="mb-4">The prompt you're looking for doesn't exist or has been deleted.</p>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">{prompt.title}</h1>
          <p className="text-muted-foreground">{prompt.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/prompts/${promptId}/edit`}>Edit</Link>
          </Button>
          <Button variant="destructive">Delete</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-md p-4 whitespace-pre-wrap">
                {prompt.content}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Copy to Clipboard</Button>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Category</dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {prompt.category}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Project</dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                      {prompt.project}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                  <dd className="mt-1 text-sm">{prompt.updatedAt}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
} 