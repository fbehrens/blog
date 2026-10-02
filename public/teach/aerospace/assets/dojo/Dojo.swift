// Dojo: throwaway, colored, numbered placeholder windows for practicing AeroSpace layouts.
//   ⌘N  new window        ⌘W  close window        ⌘Q  quit
//   `open Dojo.app` while running also spawns a new window (handy for an AeroSpace keybinding).
//   Launch args: first arg = number of windows to open at start (default 1).
import AppKit

let palette: [(String, NSColor)] = [
    ("red", .systemRed), ("blue", .systemBlue), ("green", .systemGreen),
    ("orange", .systemOrange), ("purple", .systemPurple), ("teal", .systemTeal),
    ("pink", .systemPink), ("yellow", .systemYellow), ("indigo", .systemIndigo),
    ("brown", .systemBrown), ("mint", .systemMint), ("gray", .systemGray),
]

final class DojoView: NSView {
    let number: Int
    let colorName: String
    let color: NSColor
    init(number: Int, colorName: String, color: NSColor) {
        self.number = number; self.colorName = colorName; self.color = color
        super.init(frame: .zero)
    }
    required init?(coder: NSCoder) { fatalError() }

    override func draw(_ dirtyRect: NSRect) {
        color.setFill(); bounds.fill()
        let isKey = window?.isKeyWindow ?? false
        if isKey {
            NSColor.white.setStroke()
            let p = NSBezierPath(rect: bounds.insetBy(dx: 4, dy: 4)); p.lineWidth = 8; p.stroke()
        }
        let side = min(bounds.width, bounds.height)
        draw("\(number)", size: max(24, side * 0.45), weight: .heavy, dy: side * 0.06)
        draw(colorName + (isKey ? "  · focused" : ""), size: max(11, side * 0.06), weight: .medium, dy: -side * 0.22)
        let size = String(format: "%.0f × %.0f", bounds.width, bounds.height)
        draw(size, size: 11, weight: .regular, at: NSPoint(x: 12, y: 10), center: false)
    }

    private func draw(_ s: String, size: CGFloat, weight: NSFont.Weight, dy: CGFloat = 0,
                      at point: NSPoint? = nil, center: Bool = true) {
        let attrs: [NSAttributedString.Key: Any] = [
            .font: NSFont.systemFont(ofSize: size, weight: weight),
            .foregroundColor: NSColor.white.withAlphaComponent(0.92),
        ]
        let str = NSAttributedString(string: s, attributes: attrs)
        let sz = str.size()
        let origin = point ?? NSPoint(x: (bounds.width - sz.width) / 2, y: (bounds.height - sz.height) / 2 + dy)
        str.draw(at: center ? origin : (point ?? origin))
    }

    override func viewDidEndLiveResize() { needsDisplay = true }
    override func setFrameSize(_ newSize: NSSize) { super.setFrameSize(newSize); needsDisplay = true }
}

final class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate {
    var counter = 0
    var windows: [NSWindow] = []

    func applicationDidFinishLaunching(_ n: Notification) {
        buildMenu()
        let initial = CommandLine.arguments.dropFirst().compactMap { Int($0) }.first ?? 1
        for _ in 0..<max(1, initial) { newWindow() }
        NSApp.activate(ignoringOtherApps: true)
    }

    // `open Dojo.app` / dock click on a running instance → one more window
    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        newWindow(); return false
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    @objc func newWindow() {
        counter += 1
        let (name, color) = palette[(counter - 1) % palette.count]
        let w = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 480, height: 360),
                         styleMask: [.titled, .closable, .resizable, .miniaturizable],
                         backing: .buffered, defer: false)
        w.title = "Dojo \(counter) (\(name))"
        w.contentView = DojoView(number: counter, colorName: name, color: color)
        w.isReleasedWhenClosed = false
        w.delegate = self
        w.cascadeTopLeft(from: NSPoint(x: 120 + counter * 24, y: 800 - counter * 24))
        windows.append(w)
        w.makeKeyAndOrderFront(nil)
    }

    func windowDidBecomeKey(_ n: Notification) { (n.object as? NSWindow)?.contentView?.needsDisplay = true }
    func windowDidResignKey(_ n: Notification) { (n.object as? NSWindow)?.contentView?.needsDisplay = true }
    func windowWillClose(_ n: Notification) { windows.removeAll { $0 === n.object as? NSWindow } }

    private func buildMenu() {
        let main = NSMenu()
        let appItem = NSMenuItem(); main.addItem(appItem)
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "Quit Dojo", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu
        let fileItem = NSMenuItem(); main.addItem(fileItem)
        let fileMenu = NSMenu(title: "File")
        fileMenu.addItem(withTitle: "New Window", action: #selector(newWindow), keyEquivalent: "n").target = self
        fileMenu.addItem(withTitle: "Close Window", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
        fileItem.submenu = fileMenu
        NSApp.mainMenu = main
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
