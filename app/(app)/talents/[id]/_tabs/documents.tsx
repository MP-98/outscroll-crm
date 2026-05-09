import { File, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtRelative } from "@/lib/date";
import type { Document } from "@/lib/supabase/types";

export function DocumentsTab({
  talentId: _talentId,
  documents,
}: {
  talentId: string;
  documents: Document[];
}) {
  void _talentId;
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-sm">Documents</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {documents.length === 0 ? (
          <div className="px-4 py-8 text-xs text-muted-foreground text-center">
            No documents uploaded yet.
            <p className="mt-2">Upload UI ships in Phase 3 polish; storage bucket is provisioned.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                <File className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{d.filename}</div>
                  <div className="text-xs text-muted-foreground">
                    {fmtRelative(d.created_at)}
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {d.kind}
                </Badge>
                <a
                  href={d.storage_path}
                  className="text-muted-foreground hover:text-primary"
                  aria-label="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
