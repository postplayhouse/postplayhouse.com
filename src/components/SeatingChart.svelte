<div class="seating-chart">
	<div class="stage">Stage</div>

	<div class="seats">
		<div data-row="b" class="row b">
			{#each [14, 13, 12, 11, 10, 9, 8, 7, 6, 5] as i}
				<div class="seat">
					<div class="outer">
						<div class="seat-number">{i}</div>
					</div>
				</div>
			{/each}
			{#each [4, 3, 2, 1] as _na}
				<div class="seat placeholder">
					<div class="outer">
						<div class="seat-number">()</div>
					</div>
				</div>
			{/each}
		</div>

		{#each ["c", "d", "e", "f", "g", "h", "j", "k", "l", "m"] as row}
			<div data-row={row} class="row {row}">
				{#each [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as i}
					<div class="seat">
						<div class="outer">
							<div class="seat-number">{i}</div>
						</div>
					</div>
				{/each}
			</div>
		{/each}

		<div data-row="n" class="row n">
			<div class="seat handicap">
				<div class="outer">
					<div class="seat-number">14</div>
				</div>
			</div>
			<div class="seat companion">
				<div class="outer">
					<div class="seat-number">13</div>
				</div>
			</div>
			<div class="seat handicap">
				<div class="outer">
					<div class="seat-number">12</div>
				</div>
			</div>
			<div class="seat companion">
				<div class="outer">
					<div class="seat-number">11</div>
				</div>
			</div>
			{#each [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as i}
				<div class="seat">
					<div class="outer">
						<div class="seat-number">{i}</div>
					</div>
				</div>
			{/each}
		</div>

		<div data-row="p" class="row p">
			{#each [14, 13, 12, 11] as i}
				<div class="seat hold">
					<div class="outer">
						<div class="seat-number">{i}</div>
					</div>
				</div>
			{/each}
			{#each [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as i}
				<div class="seat">
					<div class="outer">
						<div class="seat-number">{i}</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<ul class="legend">
		<li><span class="bullet"></span> General seating</li>
		<li><span class="bullet handicap"></span> Handicap seating</li>
		<li><span class="bullet companion"></span> Companion seating</li>
		<li>
			<span class="bullet hold"></span>
			Held seating - Will be made available after we have confirmed the space is
			not needed for wheelchairs.
		</li>
	</ul>
</div>

<style>
	.seating-chart {
		font-size: 10px;
		max-width: 700px;
		margin: auto;
	}
	@media (min-width: 500px) {
		.seating-chart {
			font-size: 16px;
		}
	}
	.seating-chart .stage {
		background-color: #805b34;
		padding-top: 3%;
		padding-bottom: 3%;
		font-size: 2rem;
		text-align: center;
		color: white;
		border-bottom-right-radius: 18px;
		border-bottom-left-radius: 18px;
	}
	.seating-chart .seats {
		display: flex;
		flex-direction: column;
		width: 85%;
		margin: auto;
	}
	.seating-chart .row {
		display: flex;
		width: 100%;
		margin-top: 1%;
		position: relative;
	}
	.seating-chart .row::after,
	.seating-chart .row::before {
		content: attr(data-row);
		position: absolute;
		padding-top: 1%;
		right: -1.2em;
		text-transform: capitalize;
	}
	@media (min-width: 500px) {
		.seating-chart .row::after,
		.seating-chart .row::before {
			padding-top: 1.5%;
		}
	}
	.seating-chart .row::before {
		right: auto;
		left: -1.2em;
	}
	.seating-chart .seat {
		margin: 3px;
		background-color: orange;
		flex-grow: 1;
		position: relative;
	}
	.seating-chart .outer {
		background-color: green;
		position: relative;
		padding-bottom: 100%;
		width: 100%;
	}
	.seating-chart .legend {
		list-style: none;
		margin-top: 12px;
	}
	.seating-chart .legend li {
		text-indent: -3em;
		padding-left: 3em;
	}
	.seating-chart .bullet {
		background-color: green;
		display: inline-block;
		border-radius: 999em;
		margin: 3px;
		width: 18px;
		height: 18px;
		vertical-align: middle;
	}
	.seating-chart .hold .outer,
	.seating-chart .hold {
		background-color: black;
	}
	.seating-chart .handicap .outer,
	.seating-chart .handicap {
		background-color: #30b2ff;
	}
	.seating-chart .companion .outer,
	.seating-chart .companion {
		background-color: gray;
	}
	.seating-chart .seat-number {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		padding-top: 0%;
		text-align: center;
		color: white;
	}
	@media (min-width: 500px) {
		.seating-chart .seat-number {
			padding-top: 20%;
		}
	}
	.seating-chart .placeholder,
	.seating-chart .placeholder .outer {
		background-color: transparent;
	}
	.seating-chart .placeholder .seat-number {
		display: none;
	}
</style>
