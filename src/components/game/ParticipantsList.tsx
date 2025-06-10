"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeDate } from "@/lib/utils";
import { Role } from "@/types/common";
import { Crown, Trophy, Users } from "lucide-react";
import { useTranslations } from "next-intl";

export interface Participant {
  /**
   * User ID
   */
  id: string;
  /**
   * Username to display
   */
  username: string;
  /**
   * User role in the game (optional for backward compatibility)
   */
  role?: Role;
  /**
   * When the user joined the game (optional for backward compatibility)
   */
  joinedAt?: Date;
  /**
   * Number of completed bingo lines
   */
  completedLines: number;
  /**
   * Number of submissions made
   */
  submissionCount: number;
  /**
   * When the user last completed a line (optional for backward compatibility)
   */
  lastCompletedAt?: Date | null;
}

export interface ParticipantsListProps {
  /**
   * List of participants to display
   */
  participants: Participant[];
  /**
   * Current user ID to highlight
   */
  currentUserId?: string;
  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * Component to display list of game participants
 * Shows usernames, roles, completion status, and join dates
 */
export function ParticipantsList({
  participants,
  currentUserId,
  className,
}: ParticipantsListProps) {
  const t = useTranslations("Game.Share");

  // Sort participants by completed lines (descending), then by submission count
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.completedLines !== b.completedLines) {
      return b.completedLines - a.completedLines;
    }
    // If completed lines are equal, sort by submission count
    return b.submissionCount - a.submissionCount;
  });

  // Get role badge configuration
  const getRoleBadge = (role?: Role) => {
    if (!role) {
      return {
        icon: null,
        label: "Participant",
        variant: "outline" as const,
        color: "bg-gray-100 text-gray-800",
      };
    }
    switch (role) {
      case Role.CREATOR:
        return {
          icon: Crown,
          label: "Creator",
          variant: "default" as const,
          color: "bg-yellow-100 text-yellow-800",
        };
      case Role.ADMIN:
        return {
          icon: Crown,
          label: "Admin",
          variant: "secondary" as const,
          color: "bg-blue-100 text-blue-800",
        };
      case Role.PARTICIPANT:
        return {
          icon: null,
          label: "Participant",
          variant: "outline" as const,
          color: "bg-gray-100 text-gray-800",
        };
      default:
        return {
          icon: null,
          label: role,
          variant: "outline" as const,
          color: "bg-gray-100 text-gray-800",
        };
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t("participants")} ({participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm">
            No participants yet
          </p>
        ) : (
          <div className="space-y-3">
            {sortedParticipants.map((participant, index) => {
              const roleBadge = getRoleBadge(participant.role);
              const RoleIcon = roleBadge.icon;
              const isCurrentUser = participant.id === currentUserId;
              const isTopPerformer =
                index === 0 && 0 < participant.completedLines;

              return (
                <div
                  key={participant.id}
                  className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
                    isCurrentUser
                      ? "bg-primary/5 ring-1 ring-primary/20"
                      : "hover:bg-muted/50"
                  }`}
                >
                  {/* Avatar */}
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="font-medium text-sm">
                      {participant.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`truncate font-medium text-sm ${
                          isCurrentUser ? "text-primary" : ""
                        }`}
                      >
                        {participant.username}
                        {isCurrentUser && " (You)"}
                      </p>
                      {isTopPerformer && (
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>

                    {/* Role and Submission Count */}
                    <div className="mt-1 flex items-center gap-2">
                      {participant.role &&
                        participant.role !== Role.PARTICIPANT && (
                          <Badge
                            variant={roleBadge.variant}
                            className={`${roleBadge.color} text-xs`}
                          >
                            {RoleIcon && <RoleIcon className="mr-1 h-3 w-3" />}
                            {roleBadge.label}
                          </Badge>
                        )}
                      <span className="text-muted-foreground text-xs">
                        {participant.submissionCount} submissions
                      </span>
                    </div>
                  </div>

                  {/* Completion Status */}
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {participant.completedLines} lines
                    </p>
                    {participant.lastCompletedAt && (
                      <p className="text-muted-foreground text-xs">
                        Last: {formatRelativeDate(participant.lastCompletedAt)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
