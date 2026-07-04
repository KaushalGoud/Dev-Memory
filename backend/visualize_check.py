import asyncio
import os
import cognee

async def visualize():
    output_path = os.path.join(os.getcwd(), "graph_visualization.html")
    html_file = await cognee.visualize_graph(output_path)
    print(f"Saved to {html_file}")

asyncio.run(visualize())
