'use client';
import { useState } from 'react';
import styles from './BmiCalculator.module.css';

function getBmiCategory(bmi: number): { label: string; color: string; advice: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'var(--clr-info)', advice: 'Consider increasing nutrient-rich food intake.' };
  if (bmi < 25) return { label: 'Healthy Weight', color: 'var(--clr-green)', advice: 'Great job! Keep up your healthy lifestyle.' };
  if (bmi < 30) return { label: 'Overweight', color: 'var(--clr-warning)', advice: 'Small lifestyle changes can make a big difference.' };
  return { label: 'Obese', color: 'var(--clr-danger)', advice: 'We recommend consulting a doctor and booking a health panel.' };
}

export default function BmiCalculator() {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [calculated, setCalculated] = useState(false);

  const calculate = () => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      setBmi(parseFloat((w / (h * h)).toFixed(1)));
      setCalculated(true);
    }
  };

  const category = bmi ? getBmiCategory(bmi) : null;
  const bmiPercent = bmi ? Math.min(Math.max(((bmi - 15) / 25) * 100, 0), 100) : 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.pill}>Free Health Check</span>
        <h2>Calculate Your BMI</h2>
        <p>Your Body Mass Index is the first step to understanding your health.</p>
      </div>

      <div className={styles.inputs}>
        <div className="form-group">
          <label className="form-label">Height (cm)</label>
          <input
            type="number"
            className="form-input"
            placeholder="e.g. 175"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Weight (kg)</label>
          <input
            type="number"
            className="form-input"
            placeholder="e.g. 70"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
      </div>

      <button className="btn btn-primary btn-lg" onClick={calculate} style={{ width: '100%' }}>
        Calculate BMI
      </button>

      {calculated && bmi && category && (
        <div className={styles.result}>
          <div className={styles.bmiNumber} style={{ color: category.color }}>
            {bmi}
          </div>
          <div className={styles.bmiLabel} style={{ color: category.color }}>
            {category.label}
          </div>

          <div className={styles.track}>
            <div className={styles.trackBar}>
              <div className={styles.trackFill} style={{ width: `${bmiPercent}%` }} />
              <div className={styles.trackIndicator} style={{ left: `${bmiPercent}%`, borderColor: category.color }} />
            </div>
            <div className={styles.trackLabels}>
              <span>Underweight</span>
              <span>Normal</span>
              <span>Overweight</span>
              <span>Obese</span>
            </div>
          </div>

          <p className={styles.advice}>{category.advice}</p>

          <div className={styles.cta}>
            <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '12px' }}>
              Want a deeper understanding of your health?
            </p>
            <a href="/tests" className="btn btn-primary">Book a Lab Test →</a>
          </div>
        </div>
      )}
    </div>
  );
}
