'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const steps = ['Basic Info', 'Body Metrics', 'Lifestyle'];

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    age: '',
    gender: '',
    height: '',
    weight: '',
    smoker: false,
    alcohol: false,
    exercise: 'moderate',
  });

  const update = (field: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        age: parseInt(form.age),
        gender: form.gender,
        height: parseFloat(form.height),
        weight: parseFloat(form.weight),
        lifestyle: {
          smoker: form.smoker,
          alcohol: form.alcohol,
          exercise: form.exercise,
        },
      });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.logo}>epuka</div>
        <div className={styles.stepIndicator}>
          {steps.map((s, i) => (
            <div key={s} className={`${styles.stepDot} ${i <= step ? styles.active : ''}`}>
              <span>{i + 1}</span>
              <label>{s}</label>
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className={styles.stepContent}>
            <h2>Tell us about yourself</h2>
            <p>This helps us personalise your health journey.</p>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={user?.displayName || ''} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Age</label>
              <input className="form-input" type="number" placeholder="e.g. 28"
                value={form.age} onChange={(e) => update('age', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-select" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Prefer not to say</option>
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className={styles.stepContent}>
            <h2>Your body metrics</h2>
            <p>Used to calculate BMI and track health trends over time.</p>
            <div className={styles.twoCol}>
              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input className="form-input" type="number" placeholder="e.g. 175"
                  value={form.height} onChange={(e) => update('height', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input className="form-input" type="number" placeholder="e.g. 68"
                  value={form.weight} onChange={(e) => update('weight', e.target.value)} />
              </div>
            </div>
            {form.height && form.weight && (
              <div className={styles.bmiPreview}>
                <span>Your BMI: </span>
                <strong style={{ color: 'var(--clr-green)' }}>
                  {(parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)).toFixed(1)}
                </strong>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className={styles.stepContent}>
            <h2>Your lifestyle</h2>
            <p>Optional but helps doctors give better insights.</p>
            <div className={styles.toggleGroup}>
              <button
                className={`${styles.toggleBtn} ${form.smoker ? styles.toggleActive : ''}`}
                onClick={() => update('smoker', !form.smoker)}>
                🚬 Smoker
              </button>
              <button
                className={`${styles.toggleBtn} ${form.alcohol ? styles.toggleActive : ''}`}
                onClick={() => update('alcohol', !form.alcohol)}>
                🍺 Drinks Alcohol
              </button>
            </div>
            <div className="form-group" style={{ marginTop: 20 }}>
              <label className="form-label">Exercise Frequency</label>
              <select className="form-select" value={form.exercise}
                onChange={(e) => update('exercise', e.target.value)}>
                <option value="none">Sedentary (No exercise)</option>
                <option value="light">Light (1–2x / week)</option>
                <option value="moderate">Moderate (3–4x / week)</option>
                <option value="heavy">Active (5+ days / week)</option>
              </select>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          {step > 0 && (
            <button className="btn btn-outline" onClick={prev}>Back</button>
          )}
          {step < steps.length - 1 ? (
            <button className="btn btn-primary" onClick={next}
              disabled={step === 0 && (!form.age || !form.gender)}>
              Continue
            </button>
          ) : (
            <button className="btn btn-primary" onClick={finish} disabled={saving}>
              {saving ? 'Saving...' : 'Complete Setup →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
