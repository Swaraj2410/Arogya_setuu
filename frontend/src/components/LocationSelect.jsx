import React, { useEffect, useState } from 'react';
import { fetchDistricts, fetchStates, fetchTalukas, fetchVillages } from '../api/locations';

const defaultInputClassName =
  'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm focus:border-brand-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400';

const defaultLabelClassName = 'text-sm text-slate-600';

const emptyLocation = {
  state: '',
  district: '',
  taluka: '',
  village: ''
};

const emptyCodes = {
  stateCode: '',
  districtCode: '',
  talukaCode: '',
  villageCode: ''
};

const findOption = (options, code) => options.find((option) => String(option.code) === String(code)) || null;

export default function LocationSelect({
  value = emptyLocation,
  onChange,
  required = false,
  inputClassName = defaultInputClassName,
  labelClassName = defaultLabelClassName
}) {
  const location = {
    state: value.state || '',
    district: value.district || '',
    taluka: value.taluka || '',
    village: value.village || ''
  };
  const [codes, setCodes] = useState(emptyCodes);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState({ states: false, districts: false, talukas: false, villages: false });
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading((current) => ({ ...current, states: true }));
    fetchStates()
      .then((data) => {
        if (!active) return;
        setStates(data);
        setError(data.length === 0 ? 'Location data is not imported yet. Import the LGD CSV in the backend.' : '');
      })
      .catch(() => {
        if (!active) return;
        setStates([]);
        setError('Location data is not available. Start the backend and import the LGD CSV.');
      })
      .finally(() => {
        if (active) {
          setLoading((current) => ({ ...current, states: false }));
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (location.state || location.district || location.taluka || location.village) {
      return;
    }
    setCodes(emptyCodes);
    setDistricts([]);
    setTalukas([]);
    setVillages([]);
  }, [location.state, location.district, location.taluka, location.village]);

  useEffect(() => {
    if (!codes.stateCode) {
      setDistricts([]);
      return;
    }

    let active = true;
    setLoading((current) => ({ ...current, districts: true }));
    fetchDistricts(codes.stateCode)
      .then((data) => {
        if (active) {
          setDistricts(data);
        }
      })
      .catch(() => {
        if (active) {
          setDistricts([]);
          setError('Failed to load districts.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading((current) => ({ ...current, districts: false }));
        }
      });

    return () => {
      active = false;
    };
  }, [codes.stateCode]);

  useEffect(() => {
    if (!codes.districtCode) {
      setTalukas([]);
      return;
    }

    let active = true;
    setLoading((current) => ({ ...current, talukas: true }));
    fetchTalukas(codes.districtCode)
      .then((data) => {
        if (active) {
          setTalukas(data);
        }
      })
      .catch(() => {
        if (active) {
          setTalukas([]);
          setError('Failed to load talukas.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading((current) => ({ ...current, talukas: false }));
        }
      });

    return () => {
      active = false;
    };
  }, [codes.districtCode]);

  useEffect(() => {
    if (!codes.talukaCode) {
      setVillages([]);
      return;
    }

    let active = true;
    setLoading((current) => ({ ...current, villages: true }));
    fetchVillages(codes.talukaCode)
      .then((data) => {
        if (active) {
          setVillages(data);
        }
      })
      .catch(() => {
        if (active) {
          setVillages([]);
          setError('Failed to load villages.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading((current) => ({ ...current, villages: false }));
        }
      });

    return () => {
      active = false;
    };
  }, [codes.talukaCode]);

  const updateState = (stateCode) => {
    const selected = findOption(states, stateCode);
    setCodes({
      stateCode: selected ? String(selected.code) : '',
      districtCode: '',
      talukaCode: '',
      villageCode: ''
    });
    setDistricts([]);
    setTalukas([]);
    setVillages([]);
    onChange({
      state: selected?.name || '',
      district: '',
      taluka: '',
      village: ''
    });
  };

  const updateDistrict = (districtCode) => {
    const selected = findOption(districts, districtCode);
    setCodes((current) => ({
      ...current,
      districtCode: selected ? String(selected.code) : '',
      talukaCode: '',
      villageCode: ''
    }));
    setTalukas([]);
    setVillages([]);
    onChange({
      ...location,
      district: selected?.name || '',
      taluka: '',
      village: ''
    });
  };

  const updateTaluka = (talukaCode) => {
    const selected = findOption(talukas, talukaCode);
    setCodes((current) => ({
      ...current,
      talukaCode: selected ? String(selected.code) : '',
      villageCode: ''
    }));
    setVillages([]);
    onChange({
      ...location,
      taluka: selected?.name || '',
      village: ''
    });
  };

  const updateVillage = (villageCode) => {
    const selected = findOption(villages, villageCode);
    setCodes((current) => ({
      ...current,
      villageCode: selected ? String(selected.code) : ''
    }));
    onChange({
      ...location,
      village: selected?.name || ''
    });
  };

  return (
    <>
      <label className={labelClassName}>
        State
        <select
          value={codes.stateCode}
          onChange={(e) => updateState(e.target.value)}
          className={inputClassName}
          required={required}
          disabled={loading.states || states.length === 0}
        >
          <option value="">{loading.states ? 'Loading states...' : 'Select state'}</option>
          {states.map((state) => (
            <option key={state.code} value={state.code}>
              {state.name}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClassName}>
        District
        <select
          value={codes.districtCode}
          onChange={(e) => updateDistrict(e.target.value)}
          className={inputClassName}
          required={required}
          disabled={!codes.stateCode || loading.districts}
        >
          <option value="">{loading.districts ? 'Loading districts...' : codes.stateCode ? 'Select district' : 'Select state first'}</option>
          {districts.map((district) => (
            <option key={district.code} value={district.code}>
              {district.name}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClassName}>
        Taluka
        <select
          value={codes.talukaCode}
          onChange={(e) => updateTaluka(e.target.value)}
          className={inputClassName}
          required={required}
          disabled={!codes.districtCode || loading.talukas}
        >
          <option value="">{loading.talukas ? 'Loading talukas...' : codes.districtCode ? 'Select taluka' : 'Select district first'}</option>
          {talukas.map((taluka) => (
            <option key={taluka.code} value={taluka.code}>
              {taluka.name}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClassName}>
        Village
        <select
          value={codes.villageCode}
          onChange={(e) => updateVillage(e.target.value)}
          className={inputClassName}
          required={required}
          disabled={!codes.talukaCode || loading.villages}
        >
          <option value="">{loading.villages ? 'Loading villages...' : codes.talukaCode ? 'Select village' : 'Select taluka first'}</option>
          {villages.map((village) => (
            <option key={village.code} value={village.code}>
              {village.name}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-xs font-medium text-amber-600 md:col-span-2">{error}</p>}
    </>
  );
}
