CREATE TABLE IF NOT EXISTS patients (
  patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  dob DATE,
  gender VARCHAR(40),
  phone VARCHAR(40),
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS doctors (
  doctor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  specialization VARCHAR(160),
  phone VARCHAR(40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS diseases (
  disease_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_name VARCHAR(160) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS diagnoses (
  diagnosis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  disease_id UUID NOT NULL REFERENCES diseases(disease_id) ON DELETE RESTRICT,
  doctor_id UUID NOT NULL REFERENCES doctors(doctor_id) ON DELETE RESTRICT,
  diagnosis_date DATE NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS treatment_plans (
  plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_id UUID NOT NULL UNIQUE REFERENCES diagnoses(diagnosis_id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS medications (
  medication_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  med_name VARCHAR(160) NOT NULL,
  dosage_form VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prescriptions (
  plan_id UUID NOT NULL REFERENCES treatment_plans(plan_id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES medications(medication_id) ON DELETE RESTRICT,
  dosage VARCHAR(120) NOT NULL,
  frequency VARCHAR(120) NOT NULL,
  duration VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_id, medication_id)
);

CREATE TABLE IF NOT EXISTS appointments (
  appointment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(doctor_id) ON DELETE RESTRICT,
  appt_datetime TIMESTAMPTZ NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
  patient_id UUID UNIQUE REFERENCES patients(patient_id) ON DELETE CASCADE,
  doctor_id UUID UNIQUE REFERENCES doctors(doctor_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (role = 'patient' AND patient_id IS NOT NULL AND doctor_id IS NULL) OR
    (role = 'doctor' AND doctor_id IS NOT NULL AND patient_id IS NULL) OR
    (role = 'admin' AND patient_id IS NULL AND doctor_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS diagnoses_patient_idx ON diagnoses(patient_id);
CREATE INDEX IF NOT EXISTS diagnoses_doctor_idx ON diagnoses(doctor_id);
CREATE INDEX IF NOT EXISTS plans_diagnosis_idx ON treatment_plans(diagnosis_id);
CREATE INDEX IF NOT EXISTS appointments_patient_datetime_idx ON appointments(patient_id, appt_datetime);
CREATE INDEX IF NOT EXISTS appointments_doctor_datetime_idx ON appointments(doctor_id, appt_datetime);