export const heroSlides = [
    {
        id: 1,
        // Terracotta Special
        image: '/uploads/hero/terracotta-banner.jpg',
        title: 'Handcrafted Terracotta Jewellery',
        subtitle: 'Rooted in tradition. Designed for everyday elegance.',
        cta: 'Shop Collection',
        link: '/category/terracotta-ornaments'
    }
];

// Basic type for Best Sellers
export interface BestSeller {
    id: number;
    name: string;
    price: string;
    image: string;
    category: string;
}

export const bestSellers: BestSeller[] = [];

export const features = [
    {
        id: 1,
        title: "Handicrafts",
        image: "/uploads/2025/01/cat-1.jpg",
        link: "/category/handicrafts"
    },
    {
        id: 2,
        title: "Heritage Mixes",
        image: "/uploads/2025/01/cat-2.jpg",
        link: "/category/heritage-mixes"
    },
    {
        id: 3,
        title: "Essential Care",
        image: "/uploads/2025/01/cat-3.jpg",
        link: "/category/essential-care"
    }
];

export const valueProps = [
    {
        id: 1,
        icon: "Headphones",
        title: "24/7 Support",
        desc: "We are here to help anytime"
    },
    {
        id: 2,
        icon: "Package",
        title: "Bulk Orders",
        desc: "Special rates for bulk purchases"
    },
    {
        id: 3,
        icon: "Truck",
        title: "Nationwide Delivery",
        desc: "Shipping across India"
    },
    {
        id: 4,
        icon: "RefreshCcw",
        title: "Easy Returns",
        desc: "Hassle-free return policy"
    }
];

export const journalData = {
    mainHeading: "The Kottravai Journal",
    subHeading: "Featured by leading media for our impact-driven work with women artisans",
    featured: {
        title: "Kottravai Creates Opportunities for Women Entrepreneurs",
        excerpt: "Empowering rural artisans through sustainable livelihood initiatives. We bridge the gap between traditional craftsmanship and modern markets, ensuring every creator gets their due.",
        date: "June 01, 2025",
        category: "Community",
        image: "/uploads/2026/01/journal-featured.jpg",
        link: "/blog/kottravai-creates-opportunities"
    },
    posts: [
        {
            id: 1,
            category: "BEGINNING",
            title: "Kottravai Women's Skill Development Training Initiative Launched by Mr.Sridhar Vembu",
            date: "June 01, 2025",
            image: "/uploads/2026/01/journal-launch.jpg",
            link: "/blog/skill-development"
        },
        {
            id: 2,
            category: "INNOVATION",
            title: "Kottravai Achievements in Kungumam Thozi Reports by Mrs.Ramya Ranganathan.",
            date: "December, 2025",
            image: "/Ach.jpeg", // Using group photo as placeholder
            link: "/blog/achievements"
        },
        {
            id: 3,
            category: "RECOGNITION",
            title: "Strengthening Women's Employment Opportunities to Recognize Their Handcrafted Works.",
            date: "June 03, 2025",
            image: "/uploads/2026/01/journal-stall.jpg",
            link: "/blog/employment-opportunities"
        },
        {
            id: 4,
            category: "GROWTH",
            title: "Transforming Beedi-Working Women into Skilled Craft Professionals",
            date: "December 20, 2025",
            image: "/4.png", // Keeping original placeholder for now as no 4th image
            link: "/blog/transforming-lives"
        }
    ]
};

export const trustedPartners = [
    {
        id: 1,
        name: "TenSemi",
        logo: "/tensemi.webp"
    },
    {
        id: 2,
        name: "Aram",
        logo: "/uploads/2026/01/Aram-Logo_Software-1.png"
    },
    {
        id: 3,
        name: "Raphael Creatives",
        logo: "/raphael.jpeg"
    },
    {
        id: 4,
        name: "Iyanthiran",
        logo: "/iyanthiran.jpeg"
    },
    {
        id: 5,
        name: "Iragu Events",
        logo: "/iragu.jpeg"
    },
    {
        id: 6,
        name: "Sprint6",
        logo: "/sprint.jpeg"
    },
    {
        id: 7,
        name: "Franchise Bhoomi",
        logo: "/franchise.jpeg"
    },
    {
        id: 8,
        name: "Startup Singam",
        logo: "/startupsingam.jpeg"
    }
];

export const testimonials = [
    {
        id: 1,
        name: "Vasuki",
        role: "INFLUENCER - BANGALORE",
        content: "The first thing we noticed about Kottravai's coconut shell products was the finish and strength. They feel solid, well-made, and natural. Nothing feels artificial or rushed. It's clear that real effort and care go into making every piece.",
        image: "/vasuki.jpeg"
    },
    {
        id: 2,
        name: "Aarthi",
        role: "ENTREPRENEUR - KOVILPATTI",
        content: "We ordered out of curiosity, but the product turned out to be really well finished. It feels natural, strong, and thoughtfully made. Definitely better than we expected.",
        image: "/Aarthi.jpeg"
    },
    {
        id: 3,
        name: "Harish",
        role: "3D ARTIST - MADURAI",
        content: "What we liked most is that everything is made in-house and in India. Knowing it supports local women and sustainable work makes the purchase feel more meaningful.",
        image: "/harish.jpeg"
    }
];

export const videoGallery = [
    {
        id: 1,
        title: "We Started a Business 14 Days After Giving Birth",
        url: "https://www.youtube.com/embed/yZ5pdzilHpw"
    },
    {
        id: 2,
        title: "Our Syllabus is the same as Uncle's Syllabus! - Raphael Creatives Karunya Gunavathi craftsmanship.",
        url: "https://www.youtube.com/embed/rws7HvDSTyo"
    },
    {
        id: 3,
        title: "The revolution of beedi-rolled hands , Mission of Kottravai - Ms. Karunya",
        url: "https://www.youtube.com/embed/gBlDzd4Ji2Y"
    }
];
