import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Calendar,
  CreditCard,
  GalleryThumbnails,
  Gauge,
  Home,
  ImageIcon,
  Inbox,
  Lightbulb,
  Search,
  User,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const items = [
  {
    title: "Home",
    url: "/dashboard",
    icon: Home,
  },

  {
    title: "Thumbnail Generator",
    url: "ai-thumbnail-generator",
    icon: ImageIcon,
  },
  {
    title: "Thumbnail Search",
    url: "/thumbnail-search",
    icon: GalleryThumbnails,
  },
  {
    title: "Outlier",
    url: "/outlier",
    icon: Gauge,
  },
  {
    title: "AI Content Generator",
    url: "/ai-content-generator",
    icon: Lightbulb,
  },
  {
    title: "Trending Keywords",
    url: "/trending-keywords",
    icon: Search,
  },
  {
    title: "Billing",
    url: "/billing",
    icon: CreditCard,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
];

export function AppSidebar() {
  const path = usePathname();
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-4 flex justify-center">
          <Logo className="w-full" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="mt-5">
              {items.map((item, index) => (
                // <SidebarMenuItem key={item.title} className='p-2'>
                //     <SidebarMenuButton asChild className=''>
                <a
                  href={item.url}
                  key={index}
                  className={`p-2 text-lg flex gap-2 items-center
                                 hover:bg-gray-100 rounded-lg ${path.includes(item.url) && "bg-gray-200ß"}`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </a>
                //     </SidebarMenuButton>
                // </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <h2 className="p-2 text-gray-400 text-sm"> @Yuthub Analysis</h2>
      </SidebarFooter>
    </Sidebar>
  );
}
