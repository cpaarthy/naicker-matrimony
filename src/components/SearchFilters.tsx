import { useState } from "react";

export interface SearchFilter {
  ageFrom: number | "";
  ageTo: number | "";
  heightFrom: number | "";
  heightTo: number | "";
  district: string;
  education: string;
  occupation: string;
  salary: number | "";
  star: string;
  rasi: string;
}

interface Props {
  onSearch: (filters: SearchFilter) => void;
}

const districtList = [
  "Chennai",
  "Coimbatore",
  "Erode",
  "Salem",
  "Madurai",
  "Tiruppur",
  "Namakkal",
  "Karur",
  "Trichy",
  "Vellore",
];

const educationList = [
  "SSLC",
  "HSC",
  "Diploma",
  "ITI",
  "B.A",
  "B.Sc",
  "B.Com",
  "B.E",
  "B.Tech",
  "M.E",
  "MBA",
  "MCA",
  "Doctor",
];

const occupationList = [
  "Software Engineer",
  "Teacher",
  "Doctor",
  "Business",
  "Government Employee",
  "Farmer",
  "Private Employee",
  "Police",
  "Bank Employee",
];

const starList = [
  "Ashwini",
  "Bharani",
  "Karthigai",
  "Rohini",
  "Mrigasira",
  "Thiruvathirai",
  "Punarpoosam",
  "Poosam",
  "Ayilyam",
  "Magam",
  "Pooram",
  "Uthiram",
  "Hastham",
  "Chithirai",
  "Swathi",
  "Visakam",
  "Anusham",
  "Kettai",
  "Moolam",
  "Pooradam",
  "Uthiradam",
  "Thiruvonam",
  "Avittam",
  "Sathayam",
  "Poorattadhi",
  "Uthirattadhi",
  "Revathi",
];

const rasiList = [
  "Mesham",
  "Rishabam",
  "Mithunam",
  "Kadagam",
  "Simmam",
  "Kanni",
  "Thulam",
  "Viruchigam",
  "Dhanusu",
  "Magaram",
  "Kumbam",
  "Meenam",
];

export default function SearchFilters({ onSearch }: Props) {
  const [filters, setFilters] = useState<SearchFilter>({
    ageFrom: "",
    ageTo: "",
    heightFrom: "",
    heightTo: "",
    district: "",
    education: "",
    occupation: "",
    salary: "",
    star: "",
    rasi: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">

      <h2 className="text-xl font-bold mb-5">
        Advanced Search
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <input
          type="number"
          name="ageFrom"
          placeholder="Age From"
          value={filters.ageFrom}
          onChange={handleChange}
          className="border rounded p-2"
        />

        <input
          type="number"
          name="ageTo"
          placeholder="Age To"
          value={filters.ageTo}
          onChange={handleChange}
          className="border rounded p-2"
        />

        <input
          type="number"
          name="heightFrom"
          placeholder="Height From (cm)"
          value={filters.heightFrom}
          onChange={handleChange}
          className="border rounded p-2"
        />

        <input
          type="number"
          name="heightTo"
          placeholder="Height To (cm)"
          value={filters.heightTo}
          onChange={handleChange}
          className="border rounded p-2"
        />

        <select
          name="district"
          value={filters.district}
          onChange={handleChange}
          className="border rounded p-2"
        >
          <option value="">District</option>

          {districtList.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        <select
          name="education"
          value={filters.education}
          onChange={handleChange}
          className="border rounded p-2"
        >
          <option value="">Education</option>

          {educationList.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        <select
          name="occupation"
          value={filters.occupation}
          onChange={handleChange}
          className="border rounded p-2"
        >
          <option value="">Occupation</option>

          {occupationList.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        <input
          type="number"
          name="salary"
          placeholder="Minimum Salary"
          value={filters.salary}
          onChange={handleChange}
          className="border rounded p-2"
        />

        <select
          name="star"
          value={filters.star}
          onChange={handleChange}
          className="border rounded p-2"
        >
          <option value="">Star</option>

          {starList.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        <select
          name="rasi"
          value={filters.rasi}
          onChange={handleChange}
          className="border rounded p-2"
        >
          <option value="">Rasi</option>

          {rasiList.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

      </div>

      <div className="mt-6">

        <button
          onClick={() => onSearch(filters)}
          className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-lg"
        >
          Search Profiles
        </button>

      </div>

    </div>
  );
}
