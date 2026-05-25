import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StoryRailProps {
  isAdmin: boolean;
  onCreatePost: () => void;
}

const stories = [
  { name: "Registrar", image: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=160&q=80" },
  { name: "Student Board", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=160&q=80" },
  { name: "Tech Club", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=160&q=80" },
  { name: "Library", image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=160&q=80" },
];

export function StoryRail({ isAdmin, onCreatePost }: StoryRailProps) {
  return (
    <div className="no-scrollbar flex gap-5 overflow-x-auto py-4">
      {isAdmin && (
        <button
          type="button"
          onClick={onCreatePost}
          className="flex min-w-20 flex-col items-center gap-2 text-center"
        >
          <div className="relative rounded-full bg-gradient-to-br from-indigo-700 to-fuchsia-600 p-[3px]">
            <Avatar className="h-16 w-16 border-4 border-white">
              <AvatarFallback>KK</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-1 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-indigo-700 text-white">
              <Plus className="h-4 w-4" />
            </span>
          </div>
          <span className="max-w-20 truncate text-xs font-semibold text-neutral-900">Add Update</span>
        </button>
      )}

      {stories.map((story) => (
        <div key={story.name} className="flex min-w-20 flex-col items-center gap-2 text-center">
          <div className="rounded-full bg-gradient-to-br from-indigo-700 via-fuchsia-500 to-rose-500 p-[3px]">
            <Avatar className="h-16 w-16 border-4 border-white">
              <AvatarImage src={story.image} />
              <AvatarFallback>{story.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
          </div>
          <span className="max-w-20 truncate text-xs font-semibold text-neutral-900">{story.name}</span>
        </div>
      ))}
    </div>
  );
}
