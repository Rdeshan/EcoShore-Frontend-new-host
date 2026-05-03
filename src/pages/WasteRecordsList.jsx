import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import API from '@/api/index.js';

export default function WasteRecordsList() {
  const [page, setPage] = useState(1);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['navbar-waste-records', page],
    queryFn: async () => {
      const { data } = await API.get('/waste-records', {
        params: { page, limit: 15 },
      });
      return data;
    },
    staleTime: 1000 * 60,
  });

  const records = response?.data || [];
  const pagination = response?.pagination || {
    page: 1,
    pages: 1,
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle>Waste Records List</CardTitle>
          <CardDescription>
            Platform-wide waste submissions with event and submitter details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading records...</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No waste records found.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-190 text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Submit Date
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Related Event
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Submit By
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr
                        key={record.id}
                        className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedRecord(record);
                          setIsDetailSheetOpen(true);
                        }}
                      >
                        <td className="px-4 py-3">
                          {new Date(
                            record.createdAt || record.collectionDate
                          ).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {record.event?.title || 'No event linked'}
                        </td>
                        <td className="px-4 py-3">
                          {record.submittedBy?.name ||
                            record.submittedBy?.email ||
                            'Unknown'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPage((previous) => Math.max(1, previous - 1))
                  }
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() =>
                    setPage((previous) =>
                      Math.min(pagination.pages, previous + 1)
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Waste Record Detail Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
          {selectedRecord && (
            <>
              <SheetHeader>
                <SheetTitle>Waste Record Details</SheetTitle>
                <SheetDescription>
                  ID:{' '}
                  {selectedRecord._id?.slice(-8) ||
                    selectedRecord.id?.slice(-8) ||
                    'N/A'}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Plastic Type */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Plastic Type
                  </Label>
                  <div className="p-3 rounded-lg bg-green-50/50 border border-green-200/50 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">
                      {selectedRecord.plasticType}
                    </span>
                  </div>
                </div>

                {/* Weight */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Weight (kg)
                  </Label>
                  <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-200/50">
                    <span className="font-semibold text-blue-900">
                      {selectedRecord.weight} kg
                    </span>
                  </div>
                </div>

                {/* Source */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Source
                  </Label>
                  <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-200/50">
                    <span className="font-semibold text-purple-900">
                      {selectedRecord.source}
                    </span>
                  </div>
                </div>

                {/* Collection Date */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Collection Date & Time
                  </Label>
                  <div className="p-3 rounded-lg bg-orange-50/50 border border-orange-200/50">
                    <span className="font-semibold text-orange-900">
                      {new Date(selectedRecord.collectionDate).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Weather Condition */}
                {selectedRecord.weather?.condition && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Weather Condition
                    </Label>
                    <div className="p-3 rounded-lg bg-cyan-50/50 border border-cyan-200/50">
                      <span className="font-semibold text-cyan-900">
                        {selectedRecord.weather.condition}
                      </span>
                    </div>
                  </div>
                )}

                {/* Temperature */}
                {selectedRecord.weather?.temperature !== undefined && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Temperature (°C)
                    </Label>
                    <div className="p-3 rounded-lg bg-red-50/50 border border-red-200/50">
                      <span className="font-semibold text-red-900">
                        {selectedRecord.weather.temperature}°C
                      </span>
                    </div>
                  </div>
                )}

                {/* Wind Speed */}
                {selectedRecord.weather?.windSpeed !== undefined && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Wind Speed (km/h)
                    </Label>
                    <div className="p-3 rounded-lg bg-slate-50/50 border border-slate-200/50">
                      <span className="font-semibold text-slate-900">
                        {selectedRecord.weather.windSpeed} km/h
                      </span>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedRecord.notes && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Notes
                    </Label>
                    <div className="p-3 rounded-lg bg-gray-50/50 border border-gray-200/50">
                      <p className="text-sm text-gray-900">
                        {selectedRecord.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Submission Date */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Submitted On
                  </Label>
                  <div className="p-3 rounded-lg bg-neutral-50/50 border border-neutral-200/50">
                    <span className="font-semibold text-neutral-900">
                      {new Date(selectedRecord.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Beach & Event & Submitter */}
                <div className="grid grid-cols-2 gap-2">
                  {selectedRecord.beachId && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Beach
                      </Label>
                      <div className="p-2 rounded-lg bg-indigo-50/50 border border-indigo-200/50">
                        <p className="text-xs font-semibold text-indigo-900 line-clamp-2">
                          {selectedRecord.beachId?.name ||
                            selectedRecord.beachId?.toString?.() ||
                            'N/A'}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedRecord.eventId && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Event
                      </Label>
                      <div className="p-2 rounded-lg bg-violet-50/50 border border-violet-200/50">
                        <p className="text-xs font-semibold text-violet-900 line-clamp-2">
                          {selectedRecord.eventId?.title ||
                            selectedRecord.eventId?.toString?.() ||
                            'N/A'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submitter Info */}
                {selectedRecord.recordedBy && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Submitted By
                    </Label>
                    <div className="p-3 rounded-lg bg-teal-50/50 border border-teal-200/50">
                      <p className="text-sm font-semibold text-teal-900">
                        {selectedRecord.recordedBy?.name ||
                          selectedRecord.recordedBy?.email ||
                          'Unknown'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full rounded-lg"
                  onClick={() => setIsDetailSheetOpen(false)}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
