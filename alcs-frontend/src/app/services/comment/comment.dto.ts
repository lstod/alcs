export interface MentionDto {
  mentionLabel: string;
  userUuid: string;
}
export interface CommentDto {
  uuid: string;
  body: string;
  author: string;
  edited: boolean;
  createdAt: number;
  isEditable: boolean;
  mentions: MentionDto[];
}

export interface CreateCommentDto {
  fileNumber: string;
  body: string;
  mentions: Map<string, MentionDto>;
}

export interface UpdateCommentDto {
  uuid: string;
  body: string;
  mentions: Map<string, MentionDto>;
}
