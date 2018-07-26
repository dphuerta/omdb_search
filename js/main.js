const omdb_api_key = "68e4cc7d";
const api_results_per_page = 10;

// Clear data in detail area.
function clear_detail_fields() {
	$("#detail_poster").remove();
	$("#detail_title").html("");
	$("#detail_score").html("");
	$("#detail_features").html("");
	$("#detail_description").html("");
    $("#detail_error").html("");
}

// Submit the form and get the results for a page number.
// Parameters:
// - page: Page number of results.

function do_search (page) {
	var search_term = $("#search_term").val();
	var source = $("#source").val();
	var source_parameter, results_length, parameters, response_type;
	var pagination_html, row_html;

	// Clear data of pagination and detail area.
	clear_detail_fields();
	$("#detail_area").hide();
	$("#pagination").html("");

	if (search_term !== "") {
		// There is a search term.

		// Parameters of the API call:
		// 	s: search term
		// 	page: page of results to retrieve
		parameters = "&s=" + encodeURIComponent(search_term) + "&page=" + encodeURIComponent(page);

		// Translate the source field value to the number needed by the API.
		switch (source) {
			case "2": source_parameter = "movie"; break;
	        case "3": source_parameter = "episode"; break;
	        case "4": source_parameter = "series"; break;
			default: source_parameter = "";
		}

		if (source_parameter !== "") {
			// There is a valid source parameter.
			parameters += "&type=" + source_parameter;
		}

		// Loading animation.
		$("#results_table").html("<img src=\"img/loading.gif\" alt=\"Loading...\" class=\"js_img_loading\" />");

		// AJAX call to OMDb API.
		$.ajax({
			url: "https://www.omdbapi.com/?apikey=" + omdb_api_key + parameters,
			dataType: "json",

			success: function (response) {
				// Do this after successful response from the server.

				var last_page;

				// Clear results area.
				$("#results_table").html("");

				if (response.Response === "True") {
					// There are valid results coming from OMDb.

					// If there are more results than those fetched, show pagination.
					if (response.totalResults > api_results_per_page) {
						last_page = Math.ceil(response.totalResults / api_results_per_page);
						pagination_html = "";
						for (i=1; i<=last_page; i++) {
							if (i.toString() !== page) {
								// Add link to page.
								pagination_html += "<a href=\"javascript:void(0)\" class=\"pagination_link\">" + i + "</a>";
							}
							else {
								// Add  current page without link.
								pagination_html += "<span id=\"pagination_current\">" + i + "</span>";
							}
						}
						$("#pagination").html(pagination_html);
					}

					// Set the message of the results area.
					$("#results_title").html(response.totalResults + " results for \"" + search_term + "\":");

					// Fill in the results area.
					$.each(response.Search, function(index, element) {

						// Add a row in the results table for each retrieved element.
						// Ignore not available fields (value="N/A").

						row_html = "<tr class=\"results_row\" data-id=\"" + element.imdbID + "\">";
							row_html += "<td class=\"results_poster_cell\">";
							if (element.Poster !== "N/A") {
								row_html += "<img class=\"results_poster\" src=\"" + element.Poster + "\" alt=\"Poster of " + element.Title + "\" />";
							}
							row_html += "</td>";
							row_html += "<td class=\"results_title_cell\">" + element.Title + " (" + element.Year + ")</td>";

							// Set uppercase for the retrieved "Type" string.
							if (element.Type !== "") {
								response_type = element.Type.charAt(0).toUpperCase() + element.Type.slice(1);
							}
							row_html += "<td class=\"results_type_cell\">(" + response_type + ")</td>";
						row_html += "</tr>";

						$("#results_table").append(row_html);
					});
				}
				else {
					// Results coming from OMDb are not valid.
					$("#results_title").html(response.Error);
				}
			},
			error: function() {
            	// Do this after error response from the server.

				// Show error message in results area.
				$("#results_title").html("Couldn't connect to server.");
			},

            complete: function() {
            	// Do this after any response from the server.

				// Remove loading animation.
				$("#results_table .js_img_loading").remove();
			}
		});
	}
	else {
		// No search term.
        $("#results_title").html("Please enter your search.");
	}
}

$(document).ready(function() {
	// Do this when DOM is loaded.

	$("body").on("submit", "#search_form", function(event) {
		// When the search form is sent, do the search retrieving the first page of results.

		// Prevent default behaviour of form, so that browser doesn't load another page.
    	event.preventDefault();

		do_search("1");
	});

	$("body").on("click", ".pagination_link", function(event) {
		// When a pagination link is clicked, do the search retrieving that page of results.
		do_search($(this).html());
	});

	$("#results_table").on("click", ".results_row", function() {
		// When a row of the results table is clicked, retieve detailed information for that element.

		var parameters, detail_features_html;

		// Parameter of the API call:
		//  i: id. of the element.
		// 	plot: length of the description of the element.
		parameters = "&i=" + encodeURIComponent($(this).data("id")) + "&plot=full";

		clear_detail_fields();

		// Loading animation.
		$("#detail_area").prepend("<img src=\"img/loading.gif\" alt=\"Loading...\" class=\"js_img_loading\" />");

		// AJAX call to OMDb API.
		$.ajax({
			url: "https://www.omdbapi.com/?apikey=" + omdb_api_key + parameters,
			dataType: "json",
			success: function (response) {
            	// Do this after successful response from the server.

				// Show the detail area (before selecting any row, it is hidden).
				$("#detail_area").show();

				// Fill in the detail area, ignoring not available fields (value="N/A").
				if (response.Poster !== "N/A") {
					$("#detail_area").prepend("<img src=\"" + response.Poster + "\" id=\"detail_poster\" alt=\"Poster of " + response.Title + "\" />");
				}
                $("#detail_title").html(response.Title + " (" + response.Year + ")");
				if (response.imdbRating !== "N/A") {
                	$("#detail_score").html("<span class=\"detail_important\">" + response.imdbRating + "</span> / 10");
				}
				detail_features_html = "";
				if (response.Runtime !== "N/A") {
					detail_features_html += "<li>" + response.Runtime + "</li>";
				}
                if (response.Genre !== "N/A") {
                	detail_features_html += "<li>" + response.Genre + "</li>";
				}
                if (response.Released !== "N/A") {
                	detail_features_html += "<li>" + response.Released + "</li>";
				}
				$("#detail_features").html(detail_features_html);
                if (response.Plot !== "N/A") {
					$("#detail_description").html(response.Plot);
				}
			},

			error: function() {
                // Do this after error response from the server.

				// Show error message in detail area.
            	$("#detail_message").html("Couldn't connect to server.");
			},

            complete: function() {
            	// Do this after any response from the server.

				// Remove loading animation.
            	$("#detail_area .js_img_loading").remove();
			}
		});

		// Change the coloured row from the previous selected row to the current one.
		$(".results_row").removeClass("results_row_selected");
		$(this).addClass("results_row_selected");
	});
});