"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import Loading from "@/app/loading";
import { useToast } from "@/hooks/use-toast";

export default function ClinicProfile() {
  const { user } = useUser();
  const clinicProfile = useQuery(api.clinics.getClinicProfile, {
    clinicId: user?.id || "",
  });
  const updateProfile = useMutation(api.clinics.upsertClinicProfile);
  const updateAvailability = useMutation(api.clinics.updateClinicAvailability);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    specializations: [] as string[],
    openingHours: "",
    isAvailable: true,
    availabilityNote: "",
  });
  const [newSpecialization, setNewSpecialization] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (clinicProfile) {
      setFormData({
        name: clinicProfile.name || "",
        address: clinicProfile.address || "",
        phone: clinicProfile.phone || "",
        email:
          clinicProfile.email || user?.primaryEmailAddress?.emailAddress || "",
        description: clinicProfile.description || "",
        specializations: clinicProfile.specializations || [],
        openingHours: clinicProfile.openingHours || "",
        isAvailable:
          clinicProfile.isAvailable !== undefined
            ? clinicProfile.isAvailable
            : true,
        availabilityNote: clinicProfile.availabilityNote || "",
      });
    } else if (user?.primaryEmailAddress) {
      // Set email from user if profile doesn't exist yet
      setFormData((prev) => ({
        ...prev,
        email: user.primaryEmailAddress?.emailAddress || "",
      }));
    }
  }, [clinicProfile, user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const addSpecialization = () => {
    if (
      newSpecialization.trim() &&
      !formData.specializations.includes(newSpecialization.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        specializations: [...prev.specializations, newSpecialization.trim()],
      }));
      setNewSpecialization("");
    }
  };

  const removeSpecialization = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // First update the profile data
      await updateProfile({
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        description: formData.description,
        specializations: formData.specializations,
        openingHours: formData.openingHours,
        isAvailable: formData.isAvailable,
        availabilityNote: formData.availabilityNote,
      });

      toast({
        variant: "default",
        title: "Update successful",
        description: "Profile updated successfully!",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      if (
        error.message &&
        error.message.includes("Clinic name already exists")
      ) {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: "Name already exists",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: error.message || "Failed to update profile",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async () => {
    try {
      await updateAvailability({
        isAvailable: !formData.isAvailable,
        availabilityNote: formData.availabilityNote,
      });

      setFormData((prev) => ({
        ...prev,
        isAvailable: !prev.isAvailable,
      }));

      toast({
        variant: "default",
        title: "Update successful",
        description: `Clinic is now ${
          !formData.isAvailable ? "available" : "unavailable"
        }`,
      });
    } catch (error: any) {
      console.error("Error updating availability:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Failed to update availability",
      });
    }
  };

  if (!user) {
    return <Loading />;
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold">Clinic Profile</h2>
        <Button
          variant="secondary"
          onClick={toggleAvailability}
          className={
            formData.isAvailable
              ? "bg-red-600 hover:bg-red-700 w-full sm:w-auto text-white"
              : "bg-green-600 hover:bg-green-700 w-full sm:w-auto text-white"
          }
        >
          {formData.isAvailable ? "Set as Unavailable" : "Set as Available"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clinic Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opening Hours
            </label>
            <input
              type="text"
              name="openingHours"
              value={formData.openingHours}
              onChange={handleChange}
              placeholder="e.g., Mon-Fri: 9am-5pm, Sat: 10am-2pm"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Availability Note
            </label>
            <input
              type="text"
              name="availabilityNote"
              value={formData.availabilityNote}
              onChange={handleChange}
              placeholder="e.g., Closed for holidays until Jan 2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Clinic Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Specializations
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.specializations.map((spec, index) => (
              <div
                key={index}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center text-sm"
              >
                <span className="max-w-[150px] sm:max-w-full truncate">
                  {spec}
                </span>
                <button
                  type="button"
                  onClick={() => removeSpecialization(index)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  aria-label={`Remove ${spec}`}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newSpecialization}
              onChange={(e) => setNewSpecialization(e.target.value)}
              placeholder="Add specialization"
              className="w-full sm:flex-grow px-3 py-2 border border-gray-300 rounded-md sm:rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              type="button"
              onClick={addSpecialization}
              className="w-full h-auto sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add
            </Button>
          </div>
        </div>

        <div className="flex items-start sm:items-center">
          <input
            type="checkbox"
            id="isAvailable"
            name="isAvailable"
            checked={formData.isAvailable}
            onChange={handleCheckboxChange}
            className="h-4 w-4 mt-1 sm:mt-0 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="isAvailable"
            className="ml-2 block text-sm text-gray-900"
          >
            Clinic is currently available for appointments
          </label>
        </div>

        <div className="flex justify-center sm:justify-start">
          <Button
            type="submit"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
