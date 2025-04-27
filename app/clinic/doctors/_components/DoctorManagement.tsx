"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import Loading from "@/app/loading";
import { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Doctor = {
  _id: Id<"doctors">;
  name: string;
  specializations: string[];
  description?: string;
  photo?: string;
};

export default function DoctorManagement() {
  const { user } = useUser();
  const doctors = useQuery(api.clinics.getDoctors, {
    clinicId: user?.id || "",
  });
  const addDoctor = useMutation(api.clinics.addDoctor);
  const updateDoctor = useMutation(api.clinics.updateDoctor);
  const deleteDoctor = useMutation(api.clinics.deleteDoctor);

  const [showForm, setShowForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    specializations: [] as string[],
    description: "",
    photo: "",
  });
  const [newSpecialization, setNewSpecialization] = useState("");
  const [saving, setSaving] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Id<"doctors"> | null>(
    null
  );
  const { toast } = useToast();

  useEffect(() => {
    if (editingDoctor) {
      setFormData({
        name: editingDoctor.name,
        specializations: editingDoctor.specializations,
        description: editingDoctor.description || "",
        photo: editingDoctor.photo || "",
      });
    } else {
      resetForm();
    }
  }, [editingDoctor]);

  const resetForm = () => {
    setFormData({
      name: "",
      specializations: [],
      description: "",
      photo: "",
    });
    setNewSpecialization("");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
      if (editingDoctor) {
        // Update existing doctor
        await updateDoctor({
          doctorId: editingDoctor._id,
          name: formData.name,
          specializations: formData.specializations,
          description: formData.description || undefined,
          photo: formData.photo || undefined,
        });
        toast({
          variant: "default",
          title: "Update successful",
          description: "Doctor updated successfully!",
        });
      } else {
        // Add new doctor
        await addDoctor({
          name: formData.name,
          specializations: formData.specializations,
          description: formData.description || undefined,
          photo: formData.photo || undefined,
        });
        toast({
          variant: "default",
          title: "Add successful",
          description: "Doctor added successfully!",
        });
      }

      resetForm();
      setShowForm(false);
      setEditingDoctor(null);
    } catch (error) {
      console.error("Error saving doctor:", error);
      toast({
        variant: "destructive",
        title: "Operation failed",
        description: "Failed to save doctor information",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setShowForm(true);
  };

  const handleDelete = (doctorId: Id<"doctors">) => {
    setDoctorToDelete(doctorId);
  };

  const confirmDelete = async () => {
    if (doctorToDelete) {
      try {
        await deleteDoctor({ doctorId: doctorToDelete });
        toast({
          variant: "default",
          title: "Operation successful",
          description: "Doctor deleted successfully!",
        });
      } catch (error) {
        console.error("Error deleting doctor:", error);
        toast({
          variant: "destructive",
          title: "Operation failed",
          description: "Failed to delete doctor information",
        });
      }
      setDoctorToDelete(null);
    }
  };

  if (!user || !doctors) {
    return <Loading />;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Doctor Management</h2>
        <Button
          onClick={() => {
            setEditingDoctor(null);
            setShowForm(!showForm);
            resetForm();
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Add New Doctor"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-medium mb-4">
            {editingDoctor ? "Edit Doctor" : "Add New Doctor"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doctor Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
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
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center"
                  >
                    {spec}
                    <button
                      type="button"
                      onClick={() => removeSpecialization(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={newSpecialization}
                  onChange={(e) => setNewSpecialization(e.target.value)}
                  placeholder="Add specialization"
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md"
                />
                <button
                  type="button"
                  onClick={addSpecialization}
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo URL
              </label>
              <input
                type="text"
                name="photo"
                value={formData.photo}
                onChange={handleChange}
                placeholder="https://example.com/doctor-photo.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                type="button"
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 mr-2"
                onClick={() => {
                  setShowForm(false);
                  setEditingDoctor(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingDoctor
                    ? "Update Doctor"
                    : "Add Doctor"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors && doctors.length > 0 ? (
          doctors.map((doctor: any) => (
            <div key={doctor._id} className="bg-white rounded-lg shadow p-6">
              {doctor.photo && (
                <div className="mb-4 flex justify-center">
                  <img
                    src={doctor.photo}
                    alt={doctor.name}
                    className="h-32 w-32 rounded-full object-cover"
                  />
                </div>
              )}
              <h3 className="text-lg font-medium text-center mb-2">
                {doctor.name}
              </h3>

              <div className="flex flex-wrap gap-1 mb-3 justify-center">
                {doctor.specializations.map((spec: string, index: number) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                  >
                    {spec}
                  </span>
                ))}
              </div>

              {doctor.description && (
                <p className="text-gray-600 text-sm mb-4">
                  {doctor.description}
                </p>
              )}

              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => handleEdit(doctor as Doctor)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm"
                >
                  Edit
                </Button>

                <AlertDialog
                  open={doctorToDelete === doctor._id}
                  onOpenChange={(open) => !open && setDoctorToDelete(null)}
                >
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(doctor._id as Id<"doctors">)}
                    className="bg-red-600 hover:bg-red-700 text-sm text-white hover:text-white"
                  >
                    Delete
                  </Button>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the doctor's information.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={confirmDelete}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No doctors added yet</p>
            <Button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              Add Your First Doctor
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
