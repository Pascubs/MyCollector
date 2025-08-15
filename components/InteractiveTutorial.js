import React, { useState, useEffect, useRef, useCallback } from 'react';

const createTutorialSteps = (isMobile, controls) => [
  {
    elementId: 'collection-selector',
    title: '1. Select a Collection',
    content: "Click here to open your collection shelf. It’s where you can switch between collections or add a new one.",
    position: 'bottom',
    preAction: () => {
      controls.closeCollectionShowcase();
      controls.closeSidebar();
      controls.closeFilterPanel();
      controls.closeActionsMenu();
    },
  },
  {
    elementId: 'collection-showcase',
    title: '2. Your Collection Shelf',
    content: "This is your shelf. Click a book to open it, or use the star to pin your favorites to the front. Click the 'Add New' card to create a new collection.",
    position: 'bottom',
    preAction: () => controls.openCollectionShowcase(),
  },
  ...(isMobile ? [{
    elementId: 'mobile-menu-toggle',
    title: '3. Open Summary & Actions',
    content: 'On mobile, tap this icon to open the main panel with your progress summary, rarity filters, and actions.',
    position: 'bottom',
    preAction: () => controls.closeCollectionShowcase(),
  }] : []),
  {
    elementId: 'progress-summary',
    title: isMobile ? '4. Track Your Progress' : '3. Track Your Progress',
    content: "This area shows your progress. Use the toggles at the bottom to switch between 'Standard', 'Complete', and 'Master' set modes for tracking.",
    position: isMobile ? 'bottom' : 'right',
    preAction: () => {
      controls.closeCollectionShowcase();
      if (isMobile) { controls.openSidebar(); } else { controls.closeSidebar(); }
    },
  },
  {
    elementId: 'rarity-summary',
    title: isMobile ? '5. Filter by Rarity' : '4. Filter by Rarity',
    content: 'Quickly filter the card list by clicking on a specific rarity. Click a selected rarity again to clear the filter.',
    position: isMobile ? 'top' : 'right',
  },
  {
    elementId: 'actions',
    title: isMobile ? '6. Collection Actions' : '5. Collection Actions',
    content: "Here you can edit collection details, fetch info for all cards, or use the 'Import / Export' menu.",
    position: isMobile ? 'top' : 'right',
  },
  {
    elementId: 'search-filter-controls',
    title: isMobile ? '7. Browse and Organize' : '6. Browse and Organize',
    content: "Use the search bar for quick finds, or switch between 'Browse' and 'Binder' views. Click the 'Filters' or 'Options' button for more controls.",
    position: 'bottom',
    preAction: () => {
      if (isMobile) controls.closeSidebar();
      controls.closeFilterPanel();
    }
  },
  {
    elementId: 'card-item',
    title: isMobile ? '8. Collect Your Cards' : '7. Collect Your Cards',
    content: 'This is a card. Click the checkbox to mark it as collected. You can also track special variants or change the card image!',
    position: 'top',
  },
  {
    elementId: 'header-actions-toggle',
    title: isMobile ? '9. App Settings' : '8. App Settings',
    content: 'This menu contains global actions like backing up ALL your data or switching between light and dark mode.',
    position: 'bottom',
    preAction: () => controls.closeActionsMenu(),
  },
  {
    elementId: 'header-actions-menu',
    title: isMobile ? '10. That\'s It!' : '9. That\'s It!',
    content: "You're all set! Enjoy managing your collections. Remember to use the 'Data Management' option to back up your progress.",
    position: 'bottom',
    preAction: () => controls.openActionsMenu(),
  },
];


const InteractiveTutorial = ({ onComplete, controls }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState({ opacity: 0 });
  const [popupStyle, setPopupStyle] = useState({ opacity: 0, top: '-9999px', left: '-9999px' });
  const popupRef = useRef(null);
  const isMobile = useRef(window.innerWidth < 1024).current;
  const tutorialSteps = useRef(createTutorialSteps(isMobile, controls)).current;

  const handleNext = useCallback((isSkip = false) => {
    const currentIndex = stepIndex;
    const currentStep = tutorialSteps[currentIndex];
    
    if (currentStep?.postAction && !isSkip) {
        currentStep.postAction();
    }
    
    if (currentIndex < tutorialSteps.length - 1) {
        setStepIndex(currentIndex + 1);
    } else {
        onComplete();
    }
  }, [stepIndex, onComplete, tutorialSteps]);

  const updatePosition = useCallback(() => {
    const currentStep = tutorialSteps[stepIndex];
    if (!currentStep) return;

    const element = document.querySelector(`[data-tour-id="${currentStep.elementId}"]`);
    if (!element) {
      // If the element disappears (e.g. on resize), hide the highlight but don't skip the step.
      // The step logic will re-evaluate on next index change.
      setHighlightStyle({ opacity: 0 });
      setPopupStyle(prev => ({ ...prev, opacity: 0 }));
      return;
    }
    
    const rect = element.getBoundingClientRect();
    const padding = 10;

    setHighlightStyle({
      width: `${rect.width + padding}px`,
      height: `${rect.height + padding}px`,
      top: `${rect.top - padding / 2}px`,
      left: `${rect.left - padding / 2}px`,
      opacity: 1,
    });

    requestAnimationFrame(() => {
        if (!popupRef.current) return;
        const popupRect = popupRef.current.getBoundingClientRect();
        let top, left;
        const margin = 15;

        switch (currentStep.position) {
          case 'top':
            top = rect.top - popupRect.height - margin;
            left = rect.left + rect.width / 2 - popupRect.width / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2 - popupRect.height / 2;
            left = rect.left - popupRect.width - margin;
            break;
          case 'right':
            top = rect.top + rect.height / 2 - popupRect.height / 2;
            left = rect.right + margin;
            break;
          default: // bottom
            top = rect.bottom + margin;
            left = rect.left + rect.width / 2 - popupRect.width / 2;
            break;
        }

        top = Math.max(10, Math.min(top, window.innerHeight - popupRect.height - 10));
        left = Math.max(10, Math.min(left, window.innerWidth - popupRect.width - 10));

        setPopupStyle({ top: `${top}px`, left: `${left}px`, opacity: 1 });
    });
  }, [stepIndex, tutorialSteps]);

  useEffect(() => {
    const currentStep = tutorialSteps[stepIndex];
    if (!currentStep) return;

    // Fade out visuals before moving to the next step
    setPopupStyle(prev => ({ ...prev, opacity: 0 }));
    setHighlightStyle({ opacity: 0 });

    // Perform any action needed before showing the step (e.g., opening a modal)
    if (currentStep.preAction) {
        currentStep.preAction();
    }

    // This timer allows the DOM to update after a preAction (e.g., a modal opening).
    // This is crucial for preventing race conditions where the tutorial tries to
    // highlight an element before it's visible.
    const timer = setTimeout(() => {
        const element = document.querySelector(`[data-tour-id="${currentStep.elementId}"]`);

        if (element) {
            // Scroll to the element instantly. The highlight's CSS transition will provide a smooth visual effect.
            // This avoids a conflicting "smooth" scroll animation on the page itself, which causes stuttering.
            element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });

            // Now that the element is in view, calculate its position for the highlight.
            updatePosition();
        } else {
            console.warn(`Tutorial element not found: ${currentStep.elementId}. Skipping step.`);
            handleNext(true); // Skip step if element not found after the delay
        }
    }, 150); // A 150ms delay is usually sufficient for DOM updates.

    // Attach resize listener to reposition the highlight if the window changes
    window.addEventListener('resize', updatePosition);
    
    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updatePosition);
    };
  }, [stepIndex, tutorialSteps, updatePosition, handleNext]);


  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const currentStep = tutorialSteps[stepIndex];
  if (!currentStep) return null;

  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'tutorial-overlay', onClick: onComplete }),
    React.createElement('div', { className: 'tutorial-highlight-hole', style: highlightStyle }),
    React.createElement('div', { className: 'tutorial-popup', ref: popupRef, style: popupStyle },
      React.createElement('h3', { className: 'font-cuphead-title text-xl mb-2 text-blue-800 dark:text-blue-300' }, currentStep.title),
      React.createElement('p', { className: 'font-cuphead-text mb-4 text-slate-700 dark:text-slate-300' }, currentStep.content),
      React.createElement('div', { className: 'flex justify-between items-center' },
        React.createElement('button', { onClick: onComplete, className: 'font-cuphead-text text-sm text-slate-500 hover:underline' }, 'Skip'),
        React.createElement('div', { className: 'flex gap-2' },
          stepIndex > 0 && React.createElement('button', { onClick: handleBack, className: 'font-cuphead-text px-3 py-1 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors' }, 'Back'),
          React.createElement('button', { onClick: () => handleNext(false), className: 'font-cuphead-text px-4 py-1 bg-blue-800 text-white rounded-md hover:bg-blue-900 transition-colors' },
            stepIndex === tutorialSteps.length - 1 ? 'Finish' : 'Next'
          )
        )
      )
    )
  );
};

export default InteractiveTutorial;
