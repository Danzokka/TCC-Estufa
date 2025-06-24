/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import React from "react";

interface BlogCardProps {
  props: {
    title: string;
    description: string;
    date: Date;
    image: string;
    slug: string;
    author: {
      name: string;
      image: string;
    };
  };
}

const BlogCard: React.FC<BlogCardProps> = ({ props }) => {
  return (
    <Link href={`/blog/${props.slug}`}>
      <article className="overflow-hidden rounded-lg shadow-sm transition hover:shadow-lg dark:shadow-gray-700/25">
        <img
          alt={props.title}
          src={props.image}
          className="h-56 w-full object-cover"
        />

        <div className="bg-white p-4 sm:p-6 dark:bg-gray-900">
          <time
            dateTime={props.date.toISOString()}
            className="block text-xs text-gray-500 dark:text-gray-400"
          >
            {props.date.toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>

          <h3 className="mt-0.5 text-lg text-gray-900 dark:text-white">
            {props.title}
          </h3>

          <p className="mt-2 line-clamp-3 text-sm/relaxed text-gray-500 dark:text-gray-400">
            {props.description}
          </p>
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;
