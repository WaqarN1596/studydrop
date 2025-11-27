export interface User {
    id: number;
    name: string;
    email: string;
    major?: string;
    year?: number;
    profilePicture?: string;
    role: 'student' | 'admin';
    createdAt?: string;
}

export interface College {
    id: number;
    name: string;
}

export interface Class {
    id: number;
    collegeId: number;
    name: string;
    code: string;
    description?: string;
    semester?: string;
}

export interface Upload {
    id: number;
    classId: number;
    userId: number;
    filename: string;
    originalFilename: string;
    title?: string;
    summary?: string;
    url: string;
    mimeType?: string;
    size?: number;
    category?: string;
    semester?: string;
    year?: number;
    createdAt: string;
    uploaderName?: string;
    className?: string;
    tags?: string[];
}

export interface Comment {
    id: number;
    upload_id: number;
    user_id: number;
    content: string;
    created_at: string;
    user_name?: string;
    user_email?: string;
}

export interface Notification {
    id: number;
    userId: number;
    type: string;
    data?: any;
    read: boolean;
    createdAt: string;
}
