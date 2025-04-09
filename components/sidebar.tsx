import Link from "next/link";

export function Sidebar() {
  return (
    <aside className="w-64 border-r h-[calc(100vh-4rem)] p-4">
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-lg font-semibold">Projects</h3>
          <ul className="space-y-1">
            <li>
              <Link 
                href="/projects/personal" 
                className="block rounded-md p-2 hover:bg-muted"
              >
                Personal
              </Link>
            </li>
            <li>
              <Link 
                href="/projects/work" 
                className="block rounded-md p-2 hover:bg-muted"
              >
                Work
              </Link>
            </li>
          </ul>
        </div>
        
        <div>
          <h3 className="mb-2 text-lg font-semibold">Categories</h3>
          <ul className="space-y-1">
            <li>
              <Link 
                href="/category/chat" 
                className="block rounded-md p-2 hover:bg-muted"
              >
                Chat
              </Link>
            </li>
            <li>
              <Link 
                href="/category/image" 
                className="block rounded-md p-2 hover:bg-muted"
              >
                Image Generation
              </Link>
            </li>
            <li>
              <Link 
                href="/category/writing" 
                className="block rounded-md p-2 hover:bg-muted"
              >
                Writing
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
} 