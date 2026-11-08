"use client";

import Link from "next/link";
import { checkoutSteps, type CheckoutStep } from "../checkoutNavigation";
import styles from "../Checkout.module.css";

export function CheckoutStepper({ currentStep }: { currentStep: CheckoutStep }) {
  return (
    <nav className={styles.checkoutStepper} aria-label="Postup objednávky">
      {checkoutSteps.map((step, index) => (
        <div key={step.number} className={styles.checkoutStepGroup}>
          {step.number <= currentStep ? (
            <Link
              className={`${styles.checkoutStep} ${
                currentStep === step.number
                  ? styles.checkoutStepActive
                  : styles.checkoutStepCompleted
              }`}
              href={step.href}
              aria-current={currentStep === step.number ? "step" : undefined}
            >
              <span className={styles.checkoutStepNumber}>
                {currentStep > step.number ? "✓" : step.number}
              </span>
              <span>{step.label}</span>
            </Link>
          ) : (
            <span className={styles.checkoutStep} aria-disabled="true">
              <span className={styles.checkoutStepNumber}>{step.number}</span>
              <span>{step.label}</span>
            </span>
          )}
          {index < checkoutSteps.length - 1 && (
            <span className={styles.checkoutStepLine} aria-hidden="true" />
          )}
        </div>
      ))}
    </nav>
  );
}
