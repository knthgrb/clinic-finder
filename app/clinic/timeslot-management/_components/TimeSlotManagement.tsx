"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import Loading from "@/app/loading";
import { useToast } from "@/hooks/use-toast";

type TimeSlot = {
  _id: string;
  clinicId: string;
  date: number;
  slots: number[];
  createdAt: number;
  updatedAt: number;
};

export default function TimeSlotManagement() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [startHour, setStartHour] = useState<number>(9); // Default 9am
  const [endHour, setEndHour] = useState<number>(17); // Default 5pm
  const [intervalMinutes, setIntervalMinutes] = useState<number>(30); // Default 30 min

  const [selectedTimeSlots, setSelectedTimeSlots] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const initialRenderRef = useRef(true);

  // Convert selected date string to timestamp (start of day)
  const selectedDayTimestamp = new Date(selectedDate);
  selectedDayTimestamp.setHours(0, 0, 0, 0);

  // Get time slots for the selected date
  const timeSlots = useQuery(api.timeSlots.getClinicTimeSlots, {
    startDate: selectedDayTimestamp.getTime(),
    endDate: selectedDayTimestamp.getTime() + 24 * 60 * 60 * 1000,
  });

  // Get approved appointments for the selected date
  const approvedAppointments = useQuery(
    api.appointments.getClinicAppointmentsByStatus,
    { status: "approved" }
  );

  // Filter appointments for the selected date
  const appointmentsForSelectedDate = approvedAppointments
    ? approvedAppointments.filter((app) => {
        const appDate = new Date(app.date);
        return (
          appDate.getFullYear() === selectedDayTimestamp.getFullYear() &&
          appDate.getMonth() === selectedDayTimestamp.getMonth() &&
          appDate.getDate() === selectedDayTimestamp.getDate()
        );
      })
    : [];

  // Mutations
  const generateDefaultSlots = useMutation(
    api.timeSlots.generateDefaultTimeSlots
  );
  const setTimeSlotsForDate = useMutation(api.timeSlots.setTimeSlotsForDate);

  // Update selected time slots when timeSlots data changes
  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    if (timeSlots && timeSlots.length > 0) {
      const slotsForDate = timeSlots.find(
        (slot) => slot.date === selectedDayTimestamp.getTime()
      );
      if (slotsForDate) {
        setSelectedTimeSlots(slotsForDate.slots);
      } else {
        setSelectedTimeSlots([]);
      }
    } else {
      setSelectedTimeSlots([]);
    }
  }, [timeSlots, selectedDayTimestamp.getTime()]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleGenerateTimeSlots = async () => {
    setIsGenerating(true);
    try {
      await generateDefaultSlots({
        date: selectedDayTimestamp.getTime(),
        startHour,
        endHour,
        intervalMinutes,
      });
      toast({
        variant: "default",
        title: "Time slots generated",
        description: "Default time slots have been generated successfully.",
      });
    } catch (error: any) {
      console.error("Error generating time slots:", error);
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message || "Failed to generate time slots.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTimeSlots = async () => {
    setIsSaving(true);
    try {
      await setTimeSlotsForDate({
        date: selectedDayTimestamp.getTime(),
        slots: selectedTimeSlots,
      });
      toast({
        variant: "default",
        title: "Time slots saved",
        description: "Time slots have been saved successfully.",
      });
    } catch (error: any) {
      console.error("Error saving time slots:", error);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error.message || "Failed to save time slots.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTimeSlot = (timestamp: number) => {
    setSelectedTimeSlots((prev) => {
      if (prev.includes(timestamp)) {
        return prev.filter((t) => t !== timestamp);
      } else {
        return [...prev, timestamp].sort((a, b) => a - b);
      }
    });
  };

  // Format time from timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if a time slot is booked
  const isTimeSlotBooked = (timestamp: number) => {
    return appointmentsForSelectedDate.some((app) => app.date === timestamp);
  };

  // Generate all possible time slots for display
  const generateAllPossibleTimeSlots = () => {
    const slots = [];
    const date = new Date(selectedDayTimestamp);

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        // Stop adding slots if we've reached the end hour
        if (hour === endHour && minute > 0) continue;

        date.setHours(hour, minute, 0, 0);
        slots.push(date.getTime());
      }
    }

    return slots;
  };

  const allPossibleTimeSlots = generateAllPossibleTimeSlots();

  // Add this function to check if all available slots are selected
  const areAllAvailableSlotsSelected = () => {
    const availableSlots = allPossibleTimeSlots.filter(
      (timestamp) => !isTimeSlotBooked(timestamp)
    );
    return availableSlots.every((timestamp) =>
      selectedTimeSlots.includes(timestamp)
    );
  };

  // Update the handler to toggle between marking all available or none available
  const handleToggleAllSlots = () => {
    if (areAllAvailableSlotsSelected()) {
      // If all slots are selected, clear them all
      setSelectedTimeSlots([]);
    } else {
      // Otherwise mark all available slots as selected
      setSelectedTimeSlots(
        allPossibleTimeSlots.filter((timestamp) => !isTimeSlotBooked(timestamp))
      );
    }
  };

  if (timeSlots === undefined || approvedAppointments === undefined) {
    return <Loading />;
  }

  return (
    <div className="space-y-6 p-2 sm:p-4 md:p-6">
      <h2 className="text-xl font-bold">Manage Time Slots</h2>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="w-full sm:flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div className="w-full sm:w-auto mt-2 sm:mt-0">
          <Button
            onClick={handleSaveTimeSlots}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? "Saving..." : "Save Time Slots"}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg p-3 sm:p-4 bg-gray-50">
        <h3 className="text-lg font-medium mb-3">
          Generate Default Time Slots
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Hour
            </label>
            <select
              value={startHour}
              onChange={(e) => setStartHour(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Hour
            </label>
            <select
              value={endHour}
              onChange={(e) => setEndHour(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interval (minutes)
            </label>
            <select
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>
        </div>

        <div className="flex justify-center lg:justify-start">
          <Button
            onClick={handleGenerateTimeSlots}
            disabled={isGenerating}
            className="w-full sm:w-auto px-8"
          >
            {isGenerating ? "Generating..." : "Generate Time Slots"}
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3">Available Time Slots</h3>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3">
          <p className="text-sm text-gray-600">
            Click on time slots to toggle their availability. Slots in green are
            available, and slots in red are already booked.
          </p>
          <Button
            variant="outline"
            onClick={handleToggleAllSlots}
            className="text-sm whitespace-nowrap"
          >
            {areAllAvailableSlotsSelected()
              ? "Clear All Slots"
              : "Mark All as Available"}
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-2">
          {allPossibleTimeSlots.map((timestamp) => {
            const isSelected = selectedTimeSlots.includes(timestamp);
            const isBooked = isTimeSlotBooked(timestamp);

            return (
              <button
                key={timestamp}
                type="button"
                onClick={() => toggleTimeSlot(timestamp)}
                disabled={isBooked}
                className={`px-2 py-1 text-sm border rounded-md ${
                  isBooked
                    ? "bg-red-100 text-red-800 border-red-300 cursor-not-allowed"
                    : isSelected
                      ? "bg-green-100 text-green-800 border-green-300"
                      : "bg-white text-gray-800 border-gray-300 hover:border-gray-400"
                }`}
              >
                {formatTime(timestamp)}
                {isBooked && <span className="block text-xs">Booked</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
