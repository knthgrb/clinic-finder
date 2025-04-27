"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import Loading from "@/app/loading";
import { useToast } from "@/hooks/use-toast";

export default function QueueManagement() {
  const { user } = useUser();
  const queueStatus = useQuery(api.queue.getQueueStatus, {
    clinicId: user?.id || "",
  });
  const updateQueue = useMutation(api.queue.updateQueueStatus);

  const [waitTime, setWaitTime] = useState<number>(
    queueStatus?.estimatedWaitTime || 15
  );
  const [currentNumber, setCurrentNumber] = useState<number>(
    queueStatus?.currentNumber || 0
  );
  const [nextNumber, setNextNumber] = useState<number>(
    queueStatus?.nextNumber || 1
  );
  const { toast } = useToast();

  useEffect(() => {
    if (queueStatus) {
      setWaitTime(queueStatus.estimatedWaitTime);
      setCurrentNumber(queueStatus.currentNumber);
      setNextNumber(queueStatus.nextNumber);
    }
  }, [queueStatus]);

  const handleUpdateQueue = async () => {
    try {
      await updateQueue({
        estimatedWaitTime: waitTime,
        currentNumber,
        nextNumber,
      });
      toast({
        variant: "default",
        title: "Update successful",
        description: "Queue status updated successfully!",
      });
    } catch (error) {
      console.error("Error updating queue status:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Failed to update queue status",
      });
    }
  };

  const handleNextPatient = () => {
    setCurrentNumber(nextNumber);
    setNextNumber(nextNumber + 1);
  };

  if (!user || !queueStatus) {
    return <Loading />;
  }

  return (
    <div className="w-full p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
        <h2 className="text-xl font-bold">Queue Management</h2>
        <Button
          onClick={handleUpdateQueue}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          Update Queue Status
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow">
          <h3 className="text-lg font-medium mb-4">Current Number</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
            <div className="text-4xl sm:text-5xl font-bold text-blue-600">
              {currentNumber}
            </div>
            <Button
              variant="outline"
              onClick={handleNextPatient}
              className="w-full sm:w-auto"
            >
              Next Patient
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 shadow">
          <h3 className="text-lg font-medium mb-4">Next Number</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
            <div className="text-4xl sm:text-5xl font-bold text-indigo-600">
              {nextNumber}
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <Button
                variant="outline"
                onClick={() => setNextNumber((prev) => Math.max(1, prev - 1))}
                className="w-full sm:w-auto"
              >
                -
              </Button>
              <Button
                variant="outline"
                onClick={() => setNextNumber((prev) => prev + 1)}
                className="w-full sm:w-auto"
              >
                +
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 shadow">
          <h3 className="text-lg font-medium mb-4">Estimated Wait Time</h3>
          <div className="flex items-center justify-between">
            <div className="text-4xl sm:text-5xl font-bold text-orange-600">
              {waitTime}
            </div>
            <div className="text-base sm:text-lg font-medium">minutes</div>
          </div>
          <div className="mt-4">
            <input
              type="range"
              min="0"
              max="120"
              step="5"
              value={waitTime}
              onChange={(e) => setWaitTime(parseInt(e.target.value, 10))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0 min</span>
              <span>30</span>
              <span>60</span>
              <span>90</span>
              <span>120 min</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 bg-blue-50 p-4 sm:p-6 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Queue Information</h3>
        <p className="text-sm sm:text-base text-gray-700">
          This information is displayed to patients in real-time. Make sure to
          keep it updated to provide accurate wait times.
        </p>
        <p className="text-sm sm:text-base text-gray-700 mt-2">
          <strong>Last updated:</strong>{" "}
          {queueStatus
            ? new Date(queueStatus.updatedAt).toLocaleString()
            : "Not updated yet"}
        </p>
      </div>
    </div>
  );
}
