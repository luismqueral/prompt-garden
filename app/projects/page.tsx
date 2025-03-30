import { MainLayout } from "@/components/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

// Mock data for projects
const mockProjects = [
  {
    id: "personal",
    name: "Personal",
    description: "Personal prompts and experiments",
    promptCount: 12,
    lastUpdated: "2 days ago",
  },
  {
    id: "work",
    name: "Work",
    description: "Professional prompts for work projects",
    promptCount: 8,
    lastUpdated: "1 day ago",
  },
  {
    id: "blog",
    name: "Blog Content",
    description: "Prompts for blog writing and SEO",
    promptCount: 5,
    lastUpdated: "1 week ago",
  },
];

export default function ProjectsPage() {
  return (
    <MainLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projects</h1>
          <p className="text-muted-foreground">Organize your prompts by project</p>
        </div>
        <Button>Create New Project</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockProjects.map((project) => (
          <Link href={`/projects/${project.id}`} key={project.id}>
            <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <span className="font-medium">{project.promptCount}</span> prompts
                </div>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                Last updated {project.lastUpdated}
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </MainLayout>
  );
} 