'use client';

import dynamic from 'next/dynamic';

const TimelineScene = dynamic(() => import('../../components/timeline/TimelineScene'), {
  ssr: false,
});

export default function TimelinePage() {
  return <TimelineScene />;
}