export type AccessRole = 'OWNER' | 'EDITOR' | 'VIEWER' | 'NONE';

export type ShareResourceType = 'DATA_ROOM' | 'FOLDER' | 'FILE';
export type ShareMode = 'PUBLIC_LINK' | 'PERMISSIONED';
export type ShareRole = 'VIEWER' | 'EDITOR';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface DataRoomListItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  folderCount: number;
  fileCount: number;
}

export interface DataRoomDetail {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  accessRole: AccessRole;
}

export interface FolderItem {
  id: string;
  name: string;
  dataRoomId: string;
  parentId: string | null;
  path: string;
  depth: number;
  createdAt: string;
  updatedAt: string;
}

export interface FileItem {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  dataRoomId: string;
  folderId: string | null;
  uploaderId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Breadcrumb {
  id: string;
  name: string;
}

export interface BrowseResponse {
  dataRoom: { id: string; name: string };
  folder: FolderItem | null;
  breadcrumbs: Breadcrumb[];
  accessRole: AccessRole;
  folders: FolderItem[];
  files: FileItem[];
}

export interface FolderStats {
  folderCount: number;
  fileCount: number;
  totalSize: string;
}

export interface DataRoomStats {
  folderCount: number;
  fileCount: number;
  totalSize: string;
}

export interface ShareGrant {
  id: string;
  shareId: string;
  email: string;
  role: ShareRole;
  createdAt: string;
}

export interface Share {
  id: string;
  resourceType: ShareResourceType;
  mode: ShareMode;
  token: string | null;
  ownerId: string;
  dataRoomId: string | null;
  folderId: string | null;
  fileId: string | null;
  createdAt: string;
  revokedAt: string | null;
  grants: ShareGrant[];
}

export interface SharedWithMeItem {
  shareId: string;
  role: ShareRole;
  resourceType: ShareResourceType;
  ownerName: string;
  dataRoom: { id: string; name: string } | null;
  folder: { id: string; name: string } | null;
  file: { id: string; name: string } | null;
  sharedAt: string;
}

export interface PublicShareResolution {
  resourceType: ShareResourceType;
  dataRoomId: string;
  folderId: string | null;
  fileId: string | null;
  token: string;
}

export interface FileVersionInfo {
  version: number;
  size: string;
  mimeType: string;
  createdAt: string;
  current: boolean;
}

export interface SearchResults {
  folders: FolderItem[];
  files: FileItem[];
}

export type ActivityAction =
  | 'UPLOADED'
  | 'VIEWED'
  | 'DOWNLOADED'
  | 'RENAMED'
  | 'MOVED'
  | 'DELETED'
  | 'CREATED_FOLDER'
  | 'SHARED'
  | 'REVOKED_SHARE';

export interface ActivityEvent {
  id: string;
  action: ActivityAction;
  resourceType: ShareResourceType;
  resourceId: string;
  resourceName: string;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
  viaPublicLink: boolean;
}

export interface ApiErrorBody {
  message: string | string[];
  suggestedName?: string;
  statusCode?: number;
  error?: string;
}
