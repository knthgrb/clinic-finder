"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import Loading from "@/app/loading";

type ClinicProfile = {
  _id: string;
  clinicId: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  description?: string;
  specializations: string[];
  isAvailable: boolean;
  availabilityNote?: string;
  openingHours?: string;
};

export default function ClinicSearch() {
  const allClinics = useQuery(api.clinics.getAllApprovedClinics);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState<
    string | null
  >(null);
  const [filteredClinics, setFilteredClinics] = useState<ClinicProfile[]>([]);
  const [allSpecializations, setAllSpecializations] = useState<string[]>([]);

  useEffect(() => {
    if (allClinics) {
      // Extract all unique specializations from all clinics
      const specializations = new Set<string>();
      allClinics.forEach((clinic: ClinicProfile) => {
        clinic.specializations.forEach((spec) => specializations.add(spec));
      });
      setAllSpecializations(Array.from(specializations).sort());

      // Apply filters
      let filtered = [...allClinics];

      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (clinic) =>
            clinic.name.toLowerCase().includes(term) ||
            clinic.description?.toLowerCase().includes(term) ||
            clinic.address.toLowerCase().includes(term)
        );
      }

      // Filter by specialization
      if (selectedSpecialization) {
        filtered = filtered.filter((clinic) =>
          clinic.specializations.includes(selectedSpecialization)
        );
      }

      setFilteredClinics(filtered);
    }
  }, [allClinics, searchTerm, selectedSpecialization]);

  if (!allClinics) {
    return <Loading />;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Find the Right Clinic</h2>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 md:col-span-2">
          <input
            type="text"
            placeholder="Search for clinics by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <select
            value={selectedSpecialization || ""}
            onChange={(e) => setSelectedSpecialization(e.target.value || null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Specializations</option>
            {allSpecializations.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredClinics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClinics.map((clinic) => (
            <div
              key={clinic._id}
              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
            >
              <div className="p-4 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold">{clinic.name}</h3>
                  {clinic.isAvailable ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Available
                    </span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      Unavailable
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{clinic.address}</p>
                {clinic.description && (
                  <p className="text-sm text-gray-700 mb-4">
                    {clinic.description.substring(0, 100)}
                    {clinic.description.length > 100 ? "..." : ""}
                  </p>
                )}
                <div className="mb-4 flex flex-wrap gap-1 flex-grow">
                  {clinic.specializations.map((spec) => (
                    <span
                      key={spec}
                      className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-auto pt-2">
                  <a
                    href={`tel:${clinic.phone}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {clinic.phone}
                  </a>
                  <Button
                    onClick={() => {
                      // Navigate to appointments tab with this clinic selected
                      window.location.href = `?tab=appointments&clinicId=${clinic.clinicId}`;
                    }}
                    className="text-sm"
                    disabled={!clinic.isAvailable}
                  >
                    Book Appointment
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No clinics found matching your search criteria.
          </p>
        </div>
      )}
    </div>
  );
}
