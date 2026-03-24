import React, { createContext, useContext, useState, useEffect } from 'react';
import { videoGallery as initialVideos } from '@/data/homeData';

export interface Video {
    id: number;
    title: string;
    url: string;
}

interface VideoContextType {
    videos: Video[];
    addVideo: (video: Omit<Video, 'id'>) => void;
    deleteVideo: (id: number) => void;
    updateVideo: (video: Video) => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [videos, setVideos] = useState<Video[]>(() => {
        const savedVideos = localStorage.getItem('kottravai_videos');
        return savedVideos ? JSON.parse(savedVideos) : initialVideos;
    });

    useEffect(() => {
        localStorage.setItem('kottravai_videos', JSON.stringify(videos));
    }, [videos]);

    const addVideo = (video: Omit<Video, 'id'>) => {
        const newVideo = { ...video, id: Date.now() };
        setVideos(prev => [...prev, newVideo]);
    };

    const deleteVideo = (id: number) => {
        setVideos(prev => prev.filter(v => v.id !== id));
    };

    const updateVideo = (updatedVideo: Video) => {
        setVideos(prev => prev.map(v => v.id === updatedVideo.id ? updatedVideo : v));
    };

    return (
        <VideoContext.Provider value={{ videos, addVideo, deleteVideo, updateVideo }}>
            {children}
        </VideoContext.Provider>
    );
};

export const useVideos = () => {
    const context = useContext(VideoContext);
    if (context === undefined) {
        throw new Error('useVideos must be used within a VideoProvider');
    }
    return context;
};
