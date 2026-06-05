import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface AdSlotProps {
  slotKey: string;
  className?: string;
}

interface AdCreative {
  id: string;
  image_url: string;
  target_url: string;
  alt_text: string;
  weight: number;
}

export const AdSlot: React.FC<AdSlotProps> = ({ slotKey, className = '' }) => {
  const [creatives, setCreatives] = useState<AdCreative[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [supportsRotation, setSupportsRotation] = useState(false);
  const [rotationInterval, setRotationInterval] = useState(5);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        // 1. Dohvati slot
        const { data: slot, error: slotError } = await supabase
          .from('ad_slots')
          .select('id, supports_rotation, rotation_interval_seconds')
          .eq('key', slotKey)
          .eq('is_active', true)
          .maybeSingle();

        console.log('AdSlot slot result:', slot, slotError);

        if (!slot) return;

        // 2. Dohvati aktivnu kampanju
        const now = new Date().toISOString();
        const { data: campaign, error: campaignError } = await supabase
          .from('ad_campaigns')
          .select('id, rotation_interval_seconds')
          .eq('slot_id', slot.id)
          .eq('status', 'active')
          .eq('is_active', true)
          .lte('start_at', now)
          .gte('end_at', now)
          .order('priority', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('AdSlot campaign result:', campaign, campaignError);

        if (!campaign) return;

        // 3. Dohvati kreative
        const { data: fetchedCreatives, error: creativesError } = await supabase
          .from('ad_creatives')
          .select('id, image_url, target_url, alt_text, weight')
          .eq('campaign_id', campaign.id)
          .eq('is_active', true)
          .order('weight', { ascending: false });

        console.log('AdSlot creatives result:', fetchedCreatives, creativesError);

        if (!fetchedCreatives || fetchedCreatives.length === 0) return;

        setCreatives(fetchedCreatives);
        setSupportsRotation(slot.supports_rotation ?? false);
        setRotationInterval(
          campaign.rotation_interval_seconds ?? (slot as any).rotation_interval_seconds ?? 5
        );
      } catch (err) {
        // Tihi fail — AdSlot ne smije rušiti stranicu
        console.error('AdSlot fetch error:', err);
      }
    };

    fetchAd();
  }, [slotKey]);

  useEffect(() => {
    if (!supportsRotation || creatives.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % creatives.length);
    }, rotationInterval * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [supportsRotation, creatives.length, rotationInterval]);

  if (creatives.length === 0) return null;

  const creative = creatives[activeIndex];

  return (
    <div
      data-testid={`ad-slot-${slotKey}`}
      className={`flex justify-center items-center ${className}`}
    >
      <a
        href={creative.target_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={creative.alt_text || 'Oglas'}
      >
        <img
          src={creative.image_url}
          alt={creative.alt_text || 'Oglas'}
          className="max-w-full h-auto rounded-lg"
          loading="lazy"
        />
      </a>
    </div>
  );
};
