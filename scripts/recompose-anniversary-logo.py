"""Extract the designer's PDF paths in their original square composition.

Source: Brooke's November 10, 2026 "60th Anniversary Logos" email, standard PDF
https://drive.google.com/file/d/1BYkEOx93H3MPxnOn93DRP9c4p8gX8AoD/view

Run: uv run --with pymupdf==2.1 scripts/recompose-anniversary-logo.py
SVGO 4.0.0 is fetched through pnpm; no project dependencies are changed.
The letterforms and numeral glitter are original PDF paths in original positions.
The surrounding rays retain the site's separately animated, center-to-edge fade.
The numeral retains the PDF's compositing layers and embedded opacity masks.
Its own SVG image document keeps those masks working in WebKit; referencing the
masked group through an external <use> incorrectly reveals the highlight box.
"""

import json
import re
import subprocess
import xml.etree.ElementTree as ET
from copy import deepcopy
from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryDirectory

import pymupdf

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/images/branding/anniversary-60-standard.pdf"
SVG = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG)


def element(tag, **attributes):
    return ET.Element(f"{{{SVG}}}{tag}", attributes)


def group(parent, name):
    child = element("g", id=name)
    parent.append(child)
    return child


def append_paths(parent, *children):
    for child in children:
        parent.append(deepcopy(child))


def numeral(source, include_glint=True):
    base, _, underlay, glitter, finish = source[1]
    root = element("svg", viewBox="55 84 31 25", width="31", height="25")
    root.append(deepcopy(source[0]))
    number = group(root, "anniversary-number")
    number.set("style", "isolation:isolate")
    append_paths(
        number,
        base[7],
        base[8],
        underlay,
        glitter,
        *finish[: 3 if include_glint else 1],
    )
    # The PDF's space glyphs have no outlines; keep every visible numeral path.
    for node in number.iter():
        for child in list(node):
            if child.tag == f"{{{SVG}}}use":
                node.remove(child)
    return root


def numeral_glint(source):
    # Keep the glow's luminance mask inside its own image document for WebKit.
    root = element("svg", viewBox="63.0759 89.4968 13.6492 16.3212")
    defs = element("defs")
    root.append(defs)
    append_paths(
        defs,
        *(
            node
            for node in source[0]
            if node.get("id") in {"mask_30_contents", "mask_30", "clip_33"}
        ),
    )
    append_paths(root, *source[1][4][1:3])
    return root


def positioned_bounds(rect, layout):
    return {
        "left": (rect.x0 - layout["x"]) / layout["width"] * 100,
        "top": (rect.y0 - layout["y"]) / layout["height"] * 100,
        "width": rect.width / layout["width"] * 100,
        "height": rect.height / layout["height"] * 100,
    }


def wordmark_sparkles(source, layout):
    sparkles = []
    for x, path in (("27.5", source[1][4][5]), ("114.3", source[1][4][7])):
        root = element("svg", viewBox="0 0 144 144", width="144", height="144")
        append_paths(root, path)
        with (
            pymupdf.open(stream=ET.tostring(root), filetype="svg") as svg,
            pymupdf.open(stream=svg.convert_to_pdf(), filetype="pdf") as pdf,
        ):
            rect = pdf[0].get_drawings()[0]["rect"]
        sparkles.append(
            {
                "id": f"wordmark-sparkle-{x}",
                "viewBox": " ".join(
                    f"{v:.8f}" for v in (rect.x0, rect.y0, rect.width, rect.height)
                ),
                **positioned_bounds(rect, layout),
            }
        )
    return sparkles


def numeral_sparkles(source, layout):
    # Keep the thousands of microscopic beads and stars in the static image.
    # Extract the 65 largest polygon stars for lightweight CSS overlays.
    # Do not redraw or move the designer's paths.
    paths = []
    for path in source[1][3].iter(f"{{{SVG}}}path"):
        outline = path.get("d", "")
        if set(re.findall(r"[A-Za-z]", outline)) != {"M", "Z"}:
            continue
        coordinates = [float(n) for n in re.findall(r"-?(?:\d*\.\d+|\d+)", outline)]
        matrix = [
            float(n)
            for n in re.findall(r"-?(?:\d*\.\d+|\d+)", path.get("transform", ""))
        ]
        width = (max(coordinates[::2]) - min(coordinates[::2])) * abs(matrix[0])
        if width >= 1:
            xs = [x * matrix[0] + matrix[4] for x in coordinates[::2]]
            ys = [y * matrix[3] + matrix[5] for y in coordinates[1::2]]
            assert matrix[1] == matrix[2] == 0
            left, top = min(xs), min(ys)
            height = max(ys) - top
            paths.append(
                {
                    "d": path.get("d"),
                    "transform": path.get("transform"),
                    "viewBox": " ".join(f"{v:.8f}" for v in (left, top, width, height)),
                    "left": round((left - 55) / 31 * 100, 8),
                    "top": round((top - 84) / 25 * 100, 8),
                    "width": round(width / 31 * 100, 8),
                    "height": round(height / 25 * 100, 8),
                }
            )
    assert len(paths) == 65, "Inspect the PDF's sparkle geometry before regenerating."
    # HTML layers use the same placement as the static SVG, without a second
    # manually maintained layout. Only the small overlays animate in Safari.
    return {
        "bounds": positioned_bounds(pymupdf.Rect(55, 84, 86, 109), layout),
        "sparkles": paths,
        "wordmarkSparkles": wordmark_sparkles(source, layout),
    }


def recompose(source, reversed_colors, layout):
    original = source[1]
    base, _, _, _, finish = original
    root = element(
        "svg",
        viewBox=" ".join(str(layout[key]) for key in ("x", "y", "width", "height")),
        width=str(layout["width"]),
        height=str(layout["height"]),
    )
    title = element("title")
    title.text = "Post Playhouse — established 1967, celebrating 60 years"
    root.append(title)
    description = element("desc")
    description.text = (
        "The designer's original square 60th anniversary composition. "
        "Original outlined lettering and glitter paths, without rearrangement."
    )
    root.append(description)
    defs = element("defs")
    root.append(defs)
    append_paths(defs, *source[0])
    rays_gradient = element(
        "radialGradient",
        id="ray-fade",
        gradientUnits="userSpaceOnUse",
        cx=str(layout["originX"]),
        cy=str(layout["originY"]),
        r="280",
    )
    for offset, opacity in ((".24", "0"), (".875", "1")):
        rays_gradient.append(
            element(
                "stop",
                offset=offset,
                **{"stop-color": "#a7a9ac", "stop-opacity": opacity},
            )
        )
    defs.append(rays_gradient)

    burst = group(root, "starburst")
    burst.set("opacity", ".5")
    for path in layout["rays"]:
        burst.append(element("path", d=path, fill="url(#ray-fade)"))

    wordmark = group(root, "wordmark")
    ink = "#ffffff" if reversed_colors else "#231f20"
    for name, path in (
        ("post", base[3]),
        ("playhouse", base[2]),
        ("established", finish[3]),
    ):
        layer = group(wordmark, name)
        append_paths(layer, path)
        if reversed_colors:
            layer[0].set("fill", ink)

    word_sparkles = group(wordmark, "wordmark-sparkles")
    for x, y, path in (("27.5", "46.7", finish[5]), ("114.3", "46.2", finish[7])):
        sparkle = group(word_sparkles, f"wordmark-sparkle-{x}")
        append_paths(sparkle, path)

    anniversary = group(root, "anniversary")
    number = group(anniversary, "anniversary-details")
    number.append(numeral(source)[1])
    years_layout = group(anniversary, "anniversary-years-layout")
    years = group(years_layout, "anniversary-years")
    append_paths(years, base[6])
    years[0].set("fill", ink)
    return ET.tostring(root, encoding="unicode")


def main():
    assert sha256(SOURCE.read_bytes()).hexdigest() == (
        "08fdd35ed316fba18b499e79fbd4de8771aa449c1f37d3cd1661cdf1d4f1e016"
    ), "The PDF changed; inspect its layer structure before recomposing it."
    with pymupdf.open(SOURCE) as document:
        source = ET.fromstring(document[0].get_svg_image())
    layout = json.loads(
        subprocess.check_output(
            [
                "pnpm",
                "exec",
                "tsx",
                "-e",
                (
                    "import { anniversaryLayout, anniversaryRays } from './src/components/anniversary-rays.ts';"
                    "console.log(JSON.stringify({...anniversaryLayout,rays:anniversaryRays('wide')}))"
                ),
            ],
            cwd=ROOT,
            text=True,
        )
    )
    (ROOT / "src/components/anniversary-sparkles.json").write_text(
        json.dumps(numeral_sparkles(source, layout), indent="\t") + "\n"
    )

    with TemporaryDirectory(prefix="anniversary-svg-") as scratch:
        config = Path(scratch) / "svgo.mjs"
        # Referenced fragments must retain their own fill, rather than having
        # it hoisted to an ancestor outside the external <use> target.
        config.write_text("""export default {
  multipass: true,
  plugins: [{ name: 'preset-default', params: { overrides: {
    cleanupIds: false,
    removeDesc: false,
    moveElemsAttrsToGroup: false,
  }}}],
};
""")
        for version in ("number", "glint", "standard", "reversed"):
            raw = Path(scratch) / f"{version}.svg"
            if version == "number":
                document = ET.tostring(
                    numeral(source, include_glint=False), encoding="unicode"
                )
            elif version == "glint":
                document = ET.tostring(numeral_glint(source), encoding="unicode")
            else:
                document = recompose(source, version == "reversed", layout)
            raw.write_text(document)
            output = ROOT / f"static/images/anniversary-60-{version}.svg"
            subprocess.run(
                [
                    "pnpm",
                    "dlx",
                    "svgo@4.0.0",
                    "--config",
                    str(config),
                    "--pretty",
                    "--final-newline",
                    "-i",
                    str(raw),
                    "-o",
                    str(output),
                ],
                cwd=ROOT,
                check=True,
            )


if __name__ == "__main__":
    main()
