export interface User {
    id: number;
    name: string;
    email: string;
    passwordHash: string;
    major?: string;
    year?: number;
    profilePicture?: string;
    role: 'student' | 'admin';
    createdAt: string;
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
}

export interface Comment {
    id: number;
    uploadId: number;
    userId: number;
    content: string;
    createdAt: string;
}

export interface Notification {
    id: number;
    userId: number;
    type: string;
    data?: string;
    read: boolean;
    createdAt: string;
}

export interface AuthRequest extends Request {
    user?: User;
}
