import { useEffect, useState } from "react";
import SearchFilters, {
  SearchFilter,
} from "../components/SearchFilters";
import { searchProfiles } from "../services/profileService";

interface Profile {
  id: string;
  name: string;
  age: number;
  height_cm: number;
  education: string;
  occupation: string;
  annual_income: number;
  district: string;
  star: string;
  rasi: string;
  photo_url: string;
}

export default function Search() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadProfiles() {
    setLoading(true);

    const { data, error } = await searchProfiles({});

    if (!error && data) {
      setProfiles(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  async function handleSearch(filters: SearchFilter) {
    setLoading(true);

    const { data, error } = await searchProfiles(filters);

    if (!error && data) {
      setProfiles(data);
    }

    setLoading(false);
  }

  return (
    <div className="max-w-7xl mx-auto px-5 py-6">

      <SearchFilters onSearch={handleSearch} />

      <div className="mt-8">

        {loading && (
          <div className="text-center py-10">
            Loading Profiles...
          </div>
        )}

        {!loading && profiles.length === 0 && (
          <div className="text-center py-10">
            No Profiles Found
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {profiles.map((profile) => (

            <div
              key={profile.id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition"
            >
              <img
                src={profile.photo_url}
                alt={profile.name}
                className="w-full h-72 object-cover rounded-t-xl"
              />

              <div className="p-4">

                <h2 className="text-lg font-bold">
                  {profile.name}
                </h2>

                <p className="text-gray-600">
                  {profile.age} Years
                </p>

                <p className="text-gray-600">
                  {profile.height_cm} cm
                </p>

                <p className="text-gray-600">
                  {profile.education}
                </p>

                <p className="text-gray-600">
                  {profile.occupation}
                </p>

                <p className="text-pink-600 font-semibold">
                  ₹ {profile.annual_income}
                </p>

                <p className="text-gray-600">
                  {profile.district}
                </p>

                <p className="text-gray-600">
                  ⭐ {profile.star}
                </p>

                <p className="text-gray-600">
                  ♈ {profile.rasi}
                </p>

                <button
                  className="w-full mt-4 bg-pink-600 text-white rounded-lg py-2 hover:bg-pink-700"
                >
                  View Profile
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}
