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

  if (!user) {
    return <Loading />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Queue Management</h2>
        <Button
          onClick={handleUpdateQueue}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Update Queue Status
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-lg font-medium mb-4">Current Number</h3>
          <div className="flex items-center justify-between">
            <div className="text-5xl font-bold text-blue-600">
              {currentNumber}
            </div>
            <Button
              onClick={handleNextPatient}
              className="bg-green-600 hover:bg-green-700"
            >
              Next Patient
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-lg font-medium mb-4">Next Number</h3>
          <div className="flex items-center justify-between">
            <div className="text-5xl font-bold text-indigo-600">
              {nextNumber}
            </div>
            <div>
              <Button
                onClick={() => setNextNumber((prev) => Math.max(1, prev - 1))}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 mr-2"
              >
                -
              </Button>
              <Button
                onClick={() => setNextNumber((prev) => prev + 1)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                +
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-lg font-medium mb-4">Estimated Wait Time</h3>
          <div className="flex items-center justify-between">
            <div className="text-5xl font-bold text-orange-600">{waitTime}</div>
            <div className="text-lg font-medium">minutes</div>
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

      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Queue Information</h3>
        <p className="text-gray-700">
          This information is displayed to patients in real-time. Make sure to
          keep it updated to provide accurate wait times.
        </p>
        <p className="text-gray-700 mt-2">
          <strong>Last updated:</strong>{" "}
          {queueStatus
            ? new Date(queueStatus.updatedAt).toLocaleString()
            : "Not updated yet"}
        </p>
      </div>
    </div>
  );
}
