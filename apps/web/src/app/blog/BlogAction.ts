"use server";

interface BlogCard {
  title: string;
  description: string;
  date: Date;
  image: string;
  slug: string;
}

const blogCardData: { About: BlogCard[]; User: BlogCard[] } = {
  About: [
    {
      title: "Como cuidar da sua estufa",
      description:
        "Aprenda a cuidar da sua estufa e maximize a produção de suas plantas.",
      date: new Date(),
      image: "/images/blog/estufa.jpg",
      slug: "como-cuidar-da-sua-estufa",
    },
    {
      title: "Dicas para maximizar a produção",
      description:
        "Descubra dicas e truques para maximizar a produção da sua estufa.",
      date: new Date(),
      image: "/images/blog/estufa.jpg",
      slug: "dicas-para-maximizar-a-producao",
    },
    {
      title: "Como escolher as plantas certas",
      description:
        "Aprenda a escolher as plantas certas para a sua estufa e maximize a produção.",
      date: new Date(),
      image: "/images/blog/plantas.jpg",
      slug: "como-escolher-as-plantas-certas",
    },
  ],
  User: [
    {
      title: "Como cuidar da sua estufa",
      description:
        "Aprenda a cuidar da sua estufa e maximize a produção de suas plantas.",
      date: new Date(),
      image: "/images/blog/estufa.jpg",
      slug: "como-cuidar-da-sua-estufa",
    },
    {
      title: "Dicas para maximizar a produção",
      description:
        "Descubra dicas e truques para maximizar a produção da sua estufa.",
      date: new Date(),
      image: "/images/blog/estufa.jpg",
      slug: "dicas-para-maximizar-a-producao",
    },
    {
      title: "Como escolher as plantas certas",
      description:
        "Aprenda a escolher as plantas certas para a sua estufa e maximize a produção.",
      date: new Date(),
      image: "/images/blog/plantas.jpg",
      slug: "como-escolher-as-plantas-certas",
    },
  ],
};

export async function getBlogData(): Promise<typeof blogCardData> {
  // Simulate fetching data from an API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(blogCardData);
    }, 1000);
  });
}
