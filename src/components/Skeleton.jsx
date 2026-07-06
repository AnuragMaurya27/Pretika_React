export function SkeletonBox({ w = "100%", h = 16, r = 8, style }) {
  return <div className="shimmer" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

export function StoryCardSkeleton() {
  return (
    <div className="card" style={{ minWidth: 150, width: 150 }}>
      <SkeletonBox h={200} r={0} />
      <div style={{ padding: 10 }}>
        <SkeletonBox h={13} w="90%" />
        <SkeletonBox h={11} w="60%" style={{ marginTop: 8 }} />
      </div>
    </div>
  );
}

export function HRailSkeleton({ count = 4 }) {
  return (
    <div className="hscroll container" style={{ paddingTop: 4, paddingBottom: 4 }}>
      {Array.from({ length: count }).map((_, i) => (
        <StoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="row gap-12" style={{ padding: "10px 16px" }}>
      <SkeletonBox w={64} h={84} r={10} />
      <div style={{ flex: 1 }}>
        <SkeletonBox h={14} w="80%" />
        <SkeletonBox h={11} w="50%" style={{ marginTop: 8 }} />
        <SkeletonBox h={11} w="40%" style={{ marginTop: 8 }} />
      </div>
    </div>
  );
}
