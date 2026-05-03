import React, { useState } from 'react';
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import AgentEvents from '@/components/agent/AgentEvents';
import ManageUsers from '@/components/agent/ManageUsers';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEventsByAgent, useMyWasteSubmissions } from '@/hooks/agent';

export default function AgentDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const agentId = user?._id || user?.id;
  const [activeTab, setActiveTab] = useState('events');
  const isAdmin = user?.role === 'admin';
  const { data: upcomingEventsData } = useEventsByAgent(agentId, {
    page: 1,
    limit: 1,
    status: 'UPCOMING',
  });
  const { data: wasteSubmissionsData } = useMyWasteSubmissions({
    page: 1,
    limit: 10,
  });

  const upcomingEventsCount = upcomingEventsData?.data?.pagination?.total || 0;
  const wasteSubmissions = wasteSubmissionsData?.data || [];

  const tabs = [
    { id: 'events', label: 'Events', icon: Calendar },
    ...(isAdmin ? [{ id: 'users', label: 'Users', icon: Users }] : []),
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-10">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-start gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
              className="mt-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              Agent Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Manage your assigned events and track progress
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Card className="rounded-2xl bg-primary text-primary-foreground border-none shadow-lg shadow-primary/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex justify-between items-center opacity-90">
                Upcoming Events
                <Calendar className="w-4 h-4" />
              </CardTitle>
              <div className="text-4xl font-bold mt-2">
                {upcomingEventsCount}
              </div>
            </CardHeader>
          </Card>

          <Card className="rounded-2xl border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex justify-between items-center text-muted-foreground">
                Total Volunteers
                <Users className="w-4 h-4" />
              </CardTitle>
              <div className="text-4xl font-bold mt-2">0</div>
            </CardHeader>
          </Card>

          <Card className="rounded-2xl border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex justify-between items-center text-muted-foreground">
                Assigned Beach
                <MapPin className="w-4 h-4" />
              </CardTitle>
              <div className="text-xl font-bold mt-2 truncate">
                {user?.assignedBeach?.name ||
                  user?.assignedBeach ||
                  'Not Assigned'}
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-10 flex gap-4 border-b border-border">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'events' && (
          <div className="space-y-10">
            {/* Events Section */}
            <div>
              <AgentEvents agentId={agentId} />
            </div>

            {/* Quick Stats */}
            <Card className="rounded-2xl border-border">
              <CardHeader>
                <CardTitle>Event Performance</CardTitle>
                <CardDescription>Your event management metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Completed Events
                    </p>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      All time completion rate
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Average Volunteers
                    </p>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Per event average
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border">
              <CardHeader>
                <CardTitle>Submitted Waste Records</CardTitle>
                <CardDescription>
                  Recent submissions from your assigned events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {wasteSubmissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No waste records submitted yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full min-w-160 text-sm">
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
                        {wasteSubmissions.map((record) => (
                          <tr
                            key={record.id}
                            className="border-t border-border"
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
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <ManageUsers />
          </div>
        )}
      </div>
    </div>
  );
}
