import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Loader2,
  MapPin,
  Recycle,
  Users,
  AlertCircle,
  XCircle,
  UserCheck,
  Clock,
  ChevronRight,
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useEventsByAgent, useMyWasteSubmissions } from '@/hooks/agent';
import { useWeatherByCity } from '@/hooks/weather';
import { getWeatherIconUrl } from '@/api/weatherApi';
import { submitWasteRecord } from '@/api/wasteApi';
import { toast } from 'sonner';

const PLASTIC_OPTIONS = [
  { value: 'PET', label: 'PET' },
  { value: 'HDPE', label: 'HDPE' },
  { value: 'PVC', label: 'PVC' },
  { value: 'LDPE', label: 'LDPE' },
  { value: 'PP', label: 'PP' },
  { value: 'PS', label: 'PS' },
  { value: 'OTHER', label: 'OTHER' },
];

const SOURCE_OPTIONS = [
  { value: 'CLEANUP_EVENT', label: 'Cleanup Event' },
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'COMMUNITY_DRIVE', label: 'Community Drive' },
  { value: 'CORPORATE', label: 'Corporate' },
];

const WEATHER_OPTIONS = [
  { value: 'SUNNY', label: 'Sunny' },
  { value: 'CLOUDY', label: 'Cloudy' },
  { value: 'RAINY', label: 'Rainy' },
  { value: 'WINDY', label: 'Windy' },
  { value: 'OTHER', label: 'Other' },
];

const getDefaultCollectionDateValue = () => {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 16);
};

const getInitialWasteForm = () => ({
  plasticType: '',
  weight: '',
  source: 'CLEANUP_EVENT',
  weatherCondition: '',
  temperature: '',
  windSpeed: '',
  collectionDate: getDefaultCollectionDateValue(),
  notes: '',
});

export default function AgentEvents({ agentId }) {
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const [page, setPage] = useState(1);
  const [isWasteSheetOpen, setIsWasteSheetOpen] = useState(false);
  const [isWasteDetailSheetOpen, setIsWasteDetailSheetOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedWasteRecord, setSelectedWasteRecord] = useState(null);
  const [wasteForm, setWasteForm] = useState(getInitialWasteForm());
  const [submissionFeedback, setSubmissionFeedback] = useState(null);
  const limit = 10;
  const canSubmitWaste = user?.role === 'agent';

  const { data, isLoading, error } = useEventsByAgent(agentId, { page, limit });
  const { data: wasteSubmissionsData } = useMyWasteSubmissions({ page: 1, limit: 100 });

  const createWasteRecordMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await submitWasteRecord(payload);

      const createdRecord = response?.data?.record;
      const createdRecordId = createdRecord?.id || createdRecord?._id;
      if (!createdRecordId) {
        throw new Error('Waste record was not confirmed by server.');
      }

      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['waste-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-waste-records'] });
      queryClient.invalidateQueries({ queryKey: ['navbar-waste-records'] });

      toast.success('Waste record submitted successfully');
      const createdRecord = response?.data?.record;
      setWasteForm(getInitialWasteForm());
      setSubmissionFeedback({
        type: 'success',
        message: `Waste record created successfully${createdRecord?.id ? ` (ID: ${createdRecord.id.slice(-8)})` : ''}.`,
      });
    },
    onError: (submissionError) => {
      const errorMessage =
        submissionError?.response?.data?.error ||
        submissionError?.response?.data?.message ||
        submissionError?.message ||
        'Failed to submit waste record';

      toast.error(
        errorMessage
      );
      setSubmissionFeedback({
        type: 'error',
        message: errorMessage,
      });
    },
  });

  const openWasteSheet = (event) => {
    if (!canSubmitWaste) {
      toast.error('Only agent accounts can submit waste records');
      return;
    }

    if (event.status === 'CANCELLED') {
      toast.error('Cannot submit waste records for cancelled events');
      return;
    }

    setSelectedEvent(event);
    setWasteForm(getInitialWasteForm());
    setSubmissionFeedback(null);
    setIsWasteSheetOpen(true);
  };

  const handleWasteSubmit = (event) => {
    event.preventDefault();

    if (!selectedEvent?._id) {
      toast.error('Please select a valid event');
      return;
    }

    if (!wasteForm.plasticType) {
      toast.error('Please select plastic type');
      return;
    }

    const parsedWeight = Number(wasteForm.weight);
    if (!parsedWeight || parsedWeight <= 0) {
      toast.error('Weight must be greater than 0');
      return;
    }

    if (!wasteForm.source) {
      toast.error('Please select waste source');
      return;
    }

    const collectionDate = wasteForm.collectionDate
      ? new Date(wasteForm.collectionDate)
      : null;
    if (!collectionDate || Number.isNaN(collectionDate.getTime())) {
      toast.error('Please provide a valid collection date');
      return;
    }

    if (collectionDate.getTime() > Date.now()) {
      toast.error('Collection date cannot be in the future');
      return;
    }

    const parsedTemperature =
      wasteForm.temperature === '' ? undefined : Number(wasteForm.temperature);
    if (
      parsedTemperature !== undefined &&
      (Number.isNaN(parsedTemperature) || parsedTemperature < -20 || parsedTemperature > 70)
    ) {
      toast.error('Temperature should be between -20 and 70 C');
      return;
    }

    const parsedWindSpeed =
      wasteForm.windSpeed === '' ? undefined : Number(wasteForm.windSpeed);
    if (
      parsedWindSpeed !== undefined &&
      (Number.isNaN(parsedWindSpeed) || parsedWindSpeed < 0 || parsedWindSpeed > 300)
    ) {
      toast.error('Wind speed should be between 0 and 300 km/h');
      return;
    }

    const weather =
      wasteForm.weatherCondition ||
      parsedTemperature !== undefined ||
      parsedWindSpeed !== undefined
        ? {
            ...(wasteForm.weatherCondition
              ? { condition: wasteForm.weatherCondition }
              : {}),
            ...(parsedTemperature !== undefined
              ? { temperature: parsedTemperature }
              : {}),
            ...(parsedWindSpeed !== undefined
              ? { windSpeed: parsedWindSpeed }
              : {}),
          }
        : undefined;

    const beachId = selectedEvent.beachId?._id || selectedEvent.beachId;
    if (!beachId) {
      toast.error('Beach information not available for this event');
      return;
    }

    const payload = {
      beachId: String(beachId),
      eventId: String(selectedEvent._id),
      plasticType: wasteForm.plasticType,
      weight: parsedWeight,
      source: wasteForm.source,
      weather,
      notes: wasteForm.notes?.trim() || undefined,
      collectionDate: collectionDate.toISOString(),
    };

    createWasteRecordMutation.mutate(payload);
  };

  if (!agentId) {
    return (
      <Card className="rounded-2xl border-amber-200/50 bg-amber-50/30">
        <CardContent className="pt-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">No agent selected</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="rounded-2xl border-border animate-pulse">
            <CardContent className="p-6 h-40 bg-muted/20" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl border-destructive/20 bg-destructive/5">
        <CardContent className="pt-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-destructive">
              Error loading events
            </p>
            <p className="text-sm text-muted-foreground">
              {error?.message || 'Failed to fetch events'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const events = data?.data?.events || [];
  const pagination = data?.data?.pagination || {};
  const totalPages = pagination.pages || 0;

  // Get waste records for a specific event
  const getWasteRecordsForEvent = (eventId) => {
    const allWasteRecords = wasteSubmissionsData?.data || [];
    return allWasteRecords.filter((record) => String(record.eventId?._id || record.eventId) === String(eventId));
  };

  if (events.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed border-border">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 opacity-30 mx-auto mb-3" />
            <p className="text-muted-foreground">No events assigned yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      UPCOMING: 'bg-blue-500/10 text-blue-700 border border-blue-200',
      ONGOING: 'bg-green-500/10 text-green-700 border border-green-200',
      COMPLETED: 'bg-gray-500/10 text-gray-700 border border-gray-200',
      CANCELLED: 'bg-red-500/10 text-red-700 border border-red-200',
    };
    return colors[status] || colors.UPCOMING;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Event Card Component with Weather
  const EventCard = ({ event, beachName, onRecordWaste, getWasteRecordsForEvent, canSubmitWaste }) => {
    const { data: weatherData, isLoading: isWeatherLoading } = useWeatherByCity(beachName);

    const getWeatherIcon = () => {
      if (!weatherData?.condition) return null;
      const condition = weatherData.condition.toLowerCase();
      if (condition.includes('rain')) return <CloudRain className="w-5 h-5 text-blue-500" />;
      if (condition.includes('cloud')) return <Cloud className="w-5 h-5 text-gray-400" />;
      if (condition.includes('clear') || condition.includes('sunny')) return <Sun className="w-5 h-5 text-yellow-400" />;
      return <Cloud className="w-5 h-5 text-gray-400" />;
    };

    return (
      <Card
        key={event._id}
        className="rounded-2xl border-border hover:border-primary/30 transition-all overflow-hidden group"
      >
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {event.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {event.description}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(
                event.status
              )}`}
            >
              {event.status}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-border">
            {/* Date */}
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Calendar className="w-3 h-3" /> Start Date
              </div>
              <p className="text-sm font-semibold">
                {formatDate(event.startDate)}
              </p>
            </div>

            {/* End Date */}
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Clock className="w-3 h-3" /> End Date
              </div>
              <p className="text-sm font-semibold">
                {formatDate(event.endDate)}
              </p>
            </div>

            {/* Location */}
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <MapPin className="w-3 h-3" /> Beach
              </div>
              <p className="text-sm font-semibold">
                {event.beachId?.name || 'N/A'}
              </p>
            </div>

            {/* Volunteers */}
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Users className="w-3 h-3" /> Volunteers
              </div>
              <p className="text-sm font-semibold">
                {event.volunteers?.length || 0}
                {event.maxVolunteers ? ` / ${event.maxVolunteers}` : ''}
              </p>
            </div>
          </div>

          {/* Weather Card */}
          <div className="mb-4 pb-4 border-b border-border">
            {isWeatherLoading ? (
              <div className="p-3 rounded-lg bg-slate-50/50 border border-slate-200/50">
                <p className="text-xs text-muted-foreground">Loading weather...</p>
              </div>
            ) : weatherData ? (
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Current Weather</p>
                    <div className="flex items-center gap-2">
                      {getWeatherIcon()}
                      <div>
                        <p className="text-sm font-bold text-blue-900">
                          {weatherData.temperature}°C
                        </p>
                        <p className="text-xs text-blue-700">
                          {weatherData.condition}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs space-y-1">
                    <div className="flex items-center gap-1 justify-end text-blue-700">
                      <Wind className="w-3 h-3" />
                      <span>{weatherData.windSpeed} km/h</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end text-blue-700">
                      <Droplets className="w-3 h-3" />
                      <span>{weatherData.humidity}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-50/50 border border-slate-200/50">
                <p className="text-xs text-muted-foreground">Weather unavailable</p>
              </div>
            )}
          </div>

          {/* Organizer Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Organizer</p>
                <p className="text-sm font-semibold">
                  {event.organizerId?.name || 'Unknown'}
                </p>
              </div>
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-end">
                {event.tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-secondary/50 text-xs rounded-lg font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Waste Records Section */}
          {(() => {
            const eventWasteRecords = getWasteRecordsForEvent(event._id);
            return eventWasteRecords.length > 0 ? (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-3">
                  Waste Records ({eventWasteRecords.length})
                </p>
                <div className="space-y-2">
                  {eventWasteRecords.map((record) => (
                    <button
                      key={record._id}
                      onClick={() => {
                        setSelectedWasteRecord(record);
                        setIsWasteDetailSheetOpen(true);
                      }}
                      className="w-full p-3 rounded-lg bg-green-50/50 border border-green-200/50 hover:border-green-400/70 hover:bg-green-100/50 transition-all text-left group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-sm text-green-900">
                              {record.plasticType}
                            </span>
                            <span className="text-xs text-green-700 font-semibold">
                              {record.weight}kg
                            </span>
                          </div>
                          <p className="text-xs text-green-700 mt-1">
                            {new Date(record.collectionDate).toLocaleDateString()} • {record.source}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-green-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <Button
              size="sm"
              className="rounded-lg"
              variant="default"
              disabled={!canSubmitWaste}
              onClick={() => onRecordWaste(event)}
            >
              <Recycle className="w-3.5 h-3.5 mr-1" />
              Record Waste
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Assigned Events
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Total: {pagination.total || 0} events
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {events.map((event) => {
          const beachName = event.beachId?.name || 'Beach';
          return (
            <EventCard
              key={event._id}
              event={event}
              beachName={beachName}
              onRecordWaste={openWasteSheet}
              getWasteRecordsForEvent={getWasteRecordsForEvent}
              canSubmitWaste={canSubmitWaste}
            />
          );
        })}
      </div>

      {!canSubmitWaste && (
        <Card className="rounded-2xl border-amber-200/50 bg-amber-50/40">
          <CardContent className="pt-5 text-sm text-amber-700">
            Waste submission is available only for agent accounts.
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={page === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <Sheet open={isWasteSheetOpen} onOpenChange={setIsWasteSheetOpen}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Submit Waste Record</SheetTitle>
            <SheetDescription>
              Log collected waste for event "{selectedEvent?.title || 'Selected Event'}".
            </SheetDescription>
          </SheetHeader>

          <form noValidate onSubmit={handleWasteSubmit} className="mt-6 space-y-4">
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
              <p className="font-semibold text-foreground">
                {selectedEvent?.title || 'Selected Event'}
              </p>
              <p className="text-muted-foreground mt-1">
                Beach: {selectedEvent?.beachId?.name || 'N/A'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plasticType">Plastic Type</Label>
              <Select
                value={wasteForm.plasticType}
                onValueChange={(value) =>
                  setWasteForm((prev) => ({ ...prev, plasticType: value }))
                }
              >
                <SelectTrigger id="plasticType">
                  <SelectValue placeholder="Select plastic type" />
                </SelectTrigger>
                <SelectContent>
                  {PLASTIC_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select
                value={wasteForm.source}
                onValueChange={(value) =>
                  setWasteForm((prev) => ({ ...prev, source: value }))
                }
              >
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                min="0.01"
                step="0.01"
                value={wasteForm.weight}
                onChange={(e) =>
                  setWasteForm((prev) => ({ ...prev, weight: e.target.value }))
                }
                placeholder="e.g. 12.5"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="collectionDate">Collection Date & Time</Label>
              <Input
                id="collectionDate"
                type="datetime-local"
                value={wasteForm.collectionDate}
                onChange={(e) =>
                  setWasteForm((prev) => ({
                    ...prev,
                    collectionDate: e.target.value,
                  }))
                }
              />
            </div>

            <div className="rounded-lg border border-border p-3 space-y-3">
              <p className="text-sm font-semibold text-foreground">
                Weather (optional)
              </p>

              <div className="space-y-2">
                <Label htmlFor="weatherCondition">Condition</Label>
                <Select
                  value={wasteForm.weatherCondition}
                  onValueChange={(value) =>
                    setWasteForm((prev) => ({ ...prev, weatherCondition: value }))
                  }
                >
                  <SelectTrigger id="weatherCondition">
                    <SelectValue placeholder="Select weather condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEATHER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="-20"
                    max="70"
                    step="0.1"
                    value={wasteForm.temperature}
                    onChange={(e) =>
                      setWasteForm((prev) => ({
                        ...prev,
                        temperature: e.target.value,
                      }))
                    }
                    placeholder="e.g. 30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="windSpeed">Wind Speed (km/h)</Label>
                  <Input
                    id="windSpeed"
                    type="number"
                    min="0"
                    max="300"
                    step="0.1"
                    value={wasteForm.windSpeed}
                    onChange={(e) =>
                      setWasteForm((prev) => ({
                        ...prev,
                        windSpeed: e.target.value,
                      }))
                    }
                    placeholder="e.g. 12"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                rows={4}
                maxLength={300}
                value={wasteForm.notes}
                onChange={(e) =>
                  setWasteForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Any observations about the collected waste"
              />
            </div>

            {submissionFeedback && (
              <div
                className={`rounded-md border px-3 py-2 text-sm ${
                  submissionFeedback.type === 'success'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-red-300 bg-red-50 text-red-700'
                }`}
              >
                <div className="flex items-start gap-2">
                  {submissionFeedback.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 mt-0.5" />
                  )}
                  <span>{submissionFeedback.message}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsWasteSheetOpen(false);
                  setSelectedEvent(null);
                  setSubmissionFeedback(null);
                }}
                disabled={createWasteRecordMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createWasteRecordMutation.isPending}
              >
                {createWasteRecordMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Record'
                )}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Waste Record Detail Sheet */}
      <Sheet open={isWasteDetailSheetOpen} onOpenChange={setIsWasteDetailSheetOpen}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
          {selectedWasteRecord && (
            <>
              <SheetHeader>
                <SheetTitle>Waste Record Details</SheetTitle>
                <SheetDescription>
                  ID: {selectedWasteRecord._id?.slice(-8) || 'N/A'}
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
                      {selectedWasteRecord.plasticType}
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
                      {selectedWasteRecord.weight} kg
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
                      {selectedWasteRecord.source}
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
                      {new Date(selectedWasteRecord.collectionDate).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Weather Condition */}
                {selectedWasteRecord.weather?.condition && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Weather Condition
                    </Label>
                    <div className="p-3 rounded-lg bg-cyan-50/50 border border-cyan-200/50">
                      <span className="font-semibold text-cyan-900">
                        {selectedWasteRecord.weather.condition}
                      </span>
                    </div>
                  </div>
                )}

                {/* Temperature */}
                {selectedWasteRecord.weather?.temperature !== undefined && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Temperature (°C)
                    </Label>
                    <div className="p-3 rounded-lg bg-red-50/50 border border-red-200/50">
                      <span className="font-semibold text-red-900">
                        {selectedWasteRecord.weather.temperature}°C
                      </span>
                    </div>
                  </div>
                )}

                {/* Wind Speed */}
                {selectedWasteRecord.weather?.windSpeed !== undefined && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Wind Speed (km/h)
                    </Label>
                    <div className="p-3 rounded-lg bg-slate-50/50 border border-slate-200/50">
                      <span className="font-semibold text-slate-900">
                        {selectedWasteRecord.weather.windSpeed} km/h
                      </span>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedWasteRecord.notes && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Notes
                    </Label>
                    <div className="p-3 rounded-lg bg-gray-50/50 border border-gray-200/50">
                      <p className="text-sm text-gray-900">
                        {selectedWasteRecord.notes}
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
                      {new Date(selectedWasteRecord.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Beach & Event */}
                <div className="grid grid-cols-2 gap-2">
                  {selectedWasteRecord.beachId && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Beach
                      </Label>
                      <div className="p-2 rounded-lg bg-indigo-50/50 border border-indigo-200/50">
                        <p className="text-xs font-semibold text-indigo-900 line-clamp-2">
                          {selectedWasteRecord.beachId?.name ||
                            selectedWasteRecord.beachId?.toString?.() ||
                            'N/A'}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedWasteRecord.eventId && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Event
                      </Label>
                      <div className="p-2 rounded-lg bg-violet-50/50 border border-violet-200/50">
                        <p className="text-xs font-semibold text-violet-900 line-clamp-2">
                          {selectedWasteRecord.eventId?.title ||
                            selectedWasteRecord.eventId?.toString?.() ||
                            'N/A'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full rounded-lg"
                  onClick={() => setIsWasteDetailSheetOpen(false)}
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

