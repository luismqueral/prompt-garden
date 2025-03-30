import { MainLayout } from "@/components/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function NewPromptPage() {
  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Create New Prompt</h1>
        <p className="text-muted-foreground">Add a new prompt to your collection</p>
      </div>
      
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Prompt Details</CardTitle>
          <CardDescription>Fill in the information for your new prompt</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input id="title" placeholder="Enter prompt title" />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Input id="description" placeholder="Brief description of what this prompt does" />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="project" className="text-sm font-medium">
                Project
              </label>
              <Input id="project" placeholder="Which project is this prompt for?" />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Input id="category" placeholder="E.g. chat, image, writing" />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="prompt" className="text-sm font-medium">
                Prompt Content
              </label>
              <Textarea 
                id="prompt" 
                placeholder="Enter your prompt text here..." 
                className="min-h-32"
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button>Save Prompt</Button>
        </CardFooter>
      </Card>
    </MainLayout>
  );
} 