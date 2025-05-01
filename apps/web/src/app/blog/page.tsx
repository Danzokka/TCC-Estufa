/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import BlogCard from "./components/BlogCard";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { getBlogData } from "./BlogAction";

const BlogCarrousel = ({ items }: { items: any[] }) => {
  return (
    <div className="w-full px-8">
      <Carousel className="w-full h-full">
        <CarouselContent className="w-full h-full py-2">
          {items.map((item, index) => (
            <CarouselItem key={index} className="basis-1/4">
              <BlogCard props={item} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};

interface BlogTypeProps {
  props: {
    title: string;
    description: string;
    items: any[];
  };
}

const BlogType = ({ props }: BlogTypeProps) => {
  return (
    <div className="flex flex-col gap-2 w-full items-center">
      <h3 className="text-3xl font-semibold">{props.title}</h3>
      <p className="text-foreground/60">{props.description}</p>
      <BlogCarrousel items={props.items} />
    </div>
  );
};

const Blog = async () => {

  const data = await getBlogData();

  return (
    <div className="flex flex-col w-full h-full px-8 gap-12 items-center justify-center">
      <BlogType
        props={{
          items: data.About,
          title: "Sobre a estufa",
          description:
            "Aqui você encontrará informações sobre como cuidar da sua estufa e maximizar a produção de suas plantas.",
        }}
      />
      <BlogType
        props={{
          items: data.User,
          title: "Posts dos usuários",
          description:
            "Saiba o que os usuários estão fazendo com suas estufas e como estão cuidando de suas plantas.",
        }}
      />
    </div>
  );
};

export default Blog;
