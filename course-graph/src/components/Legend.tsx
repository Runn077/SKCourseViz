type LegendProps = {
    colleges: string[];
};

function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;

    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

    const toHex = (x: number) =>
        Math.round(x * 255).toString(16).padStart(2, "0");

    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function getCollegeColor(college?: string): string {
    if (!college) return "#999999";

    let hash = 0;
    for (let i = 0; i < college.length; i++) {
        hash = college.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash % 360);
    return hslToHex(hue, 80, 50);
}

export default function Legend({ colleges }: LegendProps) {
    return (
        <div
            style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "white",
                padding: "10px",
                borderRadius: "6px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                fontSize: "12px",
                maxHeight: "300px",
                overflowY: "auto"
            }}
        >
            <strong>Colleges</strong>
            {colleges.map((college) => (
                <div
                    key={college}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        marginTop: "4px"
                    }}
                >
                    <div
                        style={{
                            width: "12px",
                            height: "12px",
                            background: getCollegeColor(college),
                            marginRight: "6px"
                        }}
                    />
                    {college}
                </div>
            ))}
        </div>
    );
}